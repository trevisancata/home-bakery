"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { actualizarFoto, borrarFoto, ordenarFotos, subirFoto } from "@/app/admin/fotos-actions";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { Icono } from "@/components/admin/ui/Icono";
import { admin } from "@/data/admin";
import type { AdminImage, Destino } from "@/lib/admin/imagenes";

const content = admin.fotos;

/** Lado mayor con el que el navegador achica la foto antes de subirla. */
const ladoMaximo = 2400;

/**
 * Achica la foto en el navegador (Vercel corta los pedidos de más de 4,5 MB
 * y una foto del celu suele pasar eso). La orientación del EXIF se aplica
 * acá; el servidor después la pasa a webp de 1600 px con sharp.
 */
async function achicar(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("No se pudo preparar la foto");
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

type Subida = { file: File; preview: string };

export function Fotos({
  destino,
  ownerId,
  iniciales,
  conSabor = false,
}: {
  destino: Destino;
  ownerId: string;
  iniciales: AdminImage[];
  /** Los productos pueden asociar una foto a un sabor. */
  conSabor?: boolean;
}) {
  const [fotos, setFotos] = useState(iniciales);
  const [subida, setSubida] = useState<Subida | null>(null);
  const [alt, setAlt] = useState("");
  const [sabor, setSabor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<"idle" | "preparando" | "subiendo">("idle");
  const [anuncio, setAnuncio] = useState("");
  const [aBorrar, setABorrar] = useState<AdminImage | null>(null);
  const [, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const altInput = useRef<HTMLInputElement>(null);
  const id = useId();

  // La vista previa usa una URL temporal: se libera al cambiar o al salir.
  useEffect(() => () => (subida ? URL.revokeObjectURL(subida.preview) : undefined), [subida]);

  function elegir(file: File | undefined) {
    setError(null);
    if (!file) return;
    setSubida({ file, preview: URL.createObjectURL(file) });
    setAlt("");
    setSabor("");
    // Después de elegir, lo que falta es la descripción.
    setTimeout(() => altInput.current?.focus(), 0);
  }

  function cancelarSubida() {
    setSubida(null);
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function subir() {
    if (!subida || estado !== "idle") return;
    if (!alt.trim()) {
      setError(admin.ui.required + ": " + content.alt.toLowerCase());
      altInput.current?.focus();
      return;
    }
    setError(null);
    setEstado("preparando");
    let archivo: File;
    try {
      archivo = await achicar(subida.file);
    } catch {
      setEstado("idle");
      setError("No pudimos leer esa foto. Probá con una JPG o PNG.");
      return;
    }
    setEstado("subiendo");
    const formData = new FormData();
    formData.set("file", archivo);
    formData.set("alt", alt);
    if (conSabor && sabor.trim()) formData.set("flavor", sabor);
    const resultado = await subirFoto(destino, ownerId, formData);
    setEstado("idle");
    if (!resultado.ok) {
      setError(resultado.fields?.alt ?? resultado.fields?.file ?? resultado.message);
      return;
    }
    setFotos((actuales) => [...actuales, resultado.data]);
    setAnuncio(content.uploaded);
    cancelarSubida();
  }

  function mover(index: number, delta: -1 | 1) {
    const destinoIndex = index + delta;
    if (destinoIndex < 0 || destinoIndex >= fotos.length) return;
    const anteriores = fotos;
    const nuevas = [...fotos];
    [nuevas[index], nuevas[destinoIndex]] = [nuevas[destinoIndex], nuevas[index]];
    setFotos(nuevas);
    setAnuncio(content.moved(destinoIndex + 1));
    // El foco sigue al botón de la foto movida (si llegó al borde, el otro botón).
    setTimeout(() => {
      const boton =
        document.getElementById(`${id}-${nuevas[destinoIndex].id}-${delta < 0 ? "arriba" : "abajo"}`) as HTMLButtonElement | null;
      (boton && !boton.disabled ? boton : document.getElementById(`${id}-${nuevas[destinoIndex].id}-${delta < 0 ? "abajo" : "arriba"}`))?.focus();
    }, 0);
    startTransition(async () => {
      const resultado = await ordenarFotos(destino, ownerId, nuevas.map((f) => f.id));
      if (!resultado.ok) {
        setFotos(anteriores);
        setAnuncio(resultado.message);
      }
    });
  }

  function portada(foto: AdminImage, n: number) {
    const anteriores = fotos;
    setFotos(fotos.map((f) => ({ ...f, cover: f.id === foto.id })));
    startTransition(async () => {
      const resultado = await actualizarFoto(destino, ownerId, foto.id, { cover: true });
      if (!resultado.ok) {
        setFotos(anteriores);
        setAnuncio(resultado.message);
      } else {
        setAnuncio(content.coverSet(n));
      }
    });
  }

  function guardarAlt(foto: AdminImage, nuevo: string) {
    if (nuevo.trim() === foto.alt) return;
    startTransition(async () => {
      const resultado = await actualizarFoto(destino, ownerId, foto.id, { alt: nuevo });
      if (resultado.ok) {
        setFotos((actuales) => actuales.map((f) => (f.id === foto.id ? resultado.data : f)));
        setAnuncio(content.altSaved);
      } else {
        setAnuncio(resultado.fields?.alt ?? resultado.message);
      }
    });
  }

  function confirmarBorrado() {
    const foto = aBorrar;
    setABorrar(null);
    if (!foto) return;
    startTransition(async () => {
      const resultado = await borrarFoto(destino, ownerId, foto.id);
      if (!resultado.ok) {
        setAnuncio(resultado.message);
        return;
      }
      setFotos((actuales) => {
        const quedan = actuales.filter((f) => f.id !== foto.id);
        // Si era la portada, la base pasa la portada a la primera que quede.
        if (foto.cover && quedan.length > 0 && !quedan.some((f) => f.cover)) quedan[0] = { ...quedan[0], cover: true };
        return quedan;
      });
      setAnuncio(content.removed);
    });
  }

  const ocupado = estado !== "idle";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-14 text-secundario">{content.hint}</p>
      <p aria-live="polite" className="sr-only">
        {anuncio}
      </p>

      {fotos.length === 0 ? (
        <p className="text-15 text-secundario">{content.empty}</p>
      ) : (
        <ol className="grid gap-3 sm:grid-cols-2">
          {fotos.map((foto, index) => {
            const n = index + 1;
            return (
              <li key={foto.id} className="flex flex-col gap-2 rounded-2xl border border-borde bg-white p-3">
                <div className="relative">
                  <Image
                    src={foto.src}
                    alt={foto.alt}
                    width={foto.width}
                    height={foto.height}
                    sizes="(min-width: 640px) 240px, 90vw"
                    className="aspect-4/3 w-full rounded-xl object-cover"
                  />
                  {foto.cover && (
                    <span className="absolute top-2 left-2 rounded-full bg-chocolate px-2.5 py-1 text-12 font-semibold text-hueso">
                      {content.cover}
                    </span>
                  )}
                </div>
                <label className="flex flex-col gap-1 text-13 font-semibold">
                  {content.altEdit(n)}
                  <input
                    type="text"
                    defaultValue={foto.alt}
                    onBlur={(event) => guardarAlt(foto, event.target.value)}
                    className="h-11 rounded-lg border border-borde-control px-2.5 text-14 font-normal"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    id={`${id}-${foto.id}-arriba`}
                    type="button"
                    onClick={() => mover(index, -1)}
                    disabled={index === 0}
                    aria-label={content.moveUp(n)}
                    className="flex size-11 items-center justify-center rounded-full hover:bg-arena disabled:opacity-40"
                  >
                    <Icono nombre="arriba" />
                  </button>
                  <button
                    id={`${id}-${foto.id}-abajo`}
                    type="button"
                    onClick={() => mover(index, 1)}
                    disabled={index === fotos.length - 1}
                    aria-label={content.moveDown(n)}
                    className="flex size-11 items-center justify-center rounded-full hover:bg-arena disabled:opacity-40"
                  >
                    <Icono nombre="abajo" />
                  </button>
                  {!foto.cover && (
                    <button
                      type="button"
                      onClick={() => portada(foto, n)}
                      aria-label={content.makeCover(n)}
                      className="min-h-11 rounded-full px-3 text-13 font-semibold text-chocolate underline"
                    >
                      {content.cover}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setABorrar(foto)}
                    aria-label={content.remove(n)}
                    className="ml-auto flex size-11 items-center justify-center rounded-full text-error hover:bg-error-fondo"
                  >
                    <Icono nombre="borrar" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-borde-control bg-white p-4">
        {!subida ? (
          <label className="flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 text-center">
            <span className="inline-flex items-center gap-2 font-semibold text-chocolate">
              <Icono nombre="subir" />
              {content.add}
            </span>
            <span className="text-13 text-secundario">{content.addHint}</span>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => elegir(event.target.files?.[0])}
              className="sr-only"
            />
          </label>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:), no pasa por next/image */}
            <img src={subida.preview} alt="" className="aspect-4/3 w-full rounded-xl object-cover sm:w-44" />
            <div className="flex grow flex-col gap-2">
              <label className="flex flex-col gap-1 text-14 font-semibold">
                {content.alt} <span className="sr-only">({admin.ui.required})</span>
                <input
                  ref={altInput}
                  type="text"
                  value={alt}
                  onChange={(event) => setAlt(event.target.value)}
                  required
                  aria-invalid={error && !alt.trim() ? true : undefined}
                  aria-describedby={`${id}-alt-hint ${id}-error`}
                  className="h-11 rounded-lg border border-borde-control px-2.5 text-15 font-normal aria-invalid:border-2 aria-invalid:border-error"
                />
              </label>
              <p id={`${id}-alt-hint`} className="text-13 text-secundario">
                {content.altHint}
              </p>
              {conSabor && (
                <label className="flex flex-col gap-1 text-14 font-semibold">
                  {content.flavor}
                  <input
                    type="text"
                    value={sabor}
                    onChange={(event) => setSabor(event.target.value)}
                    className="h-11 rounded-lg border border-borde-control px-2.5 text-15 font-normal"
                  />
                </label>
              )}
              <p id={`${id}-error`} role="alert" className="text-13 font-medium text-error">
                {error}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={subir}
                  aria-disabled={ocupado || undefined}
                  className="inline-flex min-h-11 items-center rounded-full bg-chocolate px-5 text-14 font-semibold text-hueso aria-disabled:cursor-wait aria-disabled:opacity-80"
                >
                  <span aria-live="polite">
                    {estado === "preparando" ? content.preparing : estado === "subiendo" ? content.uploading : content.upload}
                  </span>
                </button>
                <button type="button" onClick={cancelarSubida} disabled={ocupado} className="min-h-11 rounded-full px-4 text-14 font-semibold text-carbon underline">
                  {content.cancelUpload}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={aBorrar !== null}
        title={content.removeDialog.title}
        onClose={() => setABorrar(null)}
        actions={
          <>
            <button type="button" autoFocus onClick={() => setABorrar(null)} className="min-h-12 rounded-full border-trazo border-carbon px-5 font-semibold">
              {content.removeDialog.cancel}
            </button>
            <button type="button" onClick={confirmarBorrado} className="min-h-12 rounded-full bg-error px-5 font-semibold text-white">
              {content.removeDialog.confirm}
            </button>
          </>
        }
      >
        {content.removeDialog.text}
      </ConfirmDialog>
    </div>
  );
}
