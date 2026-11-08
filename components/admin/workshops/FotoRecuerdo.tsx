"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { quitarFotoRecuerdo, subirFotoRecuerdo } from "@/app/admin/fotos-actions";
import { achicar } from "@/components/admin/fotos/achicar";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { Icono } from "@/components/admin/ui/Icono";
import { admin } from "@/data/admin";
import type { MemoryPhoto } from "@/lib/admin/imagenes";

const content = admin.workshops.recuerdo;
const fotos = admin.fotos;

type Subida = { file: File; preview: string };

/**
 * Foto de cómo fue de un workshop pasado: con ella aparece en "Así fueron
 * los workshops". Mismo flujo que las fotos de productos (se achica en el
 * navegador, el servidor la pasa a webp, el alt es obligatorio), pero de a una.
 */
export function FotoRecuerdo({
  workshopId,
  inicial,
  enElSitio,
  esEjemplo,
  max,
}: {
  workshopId: string;
  inicial: MemoryPhoto | null;
  /** Si entra en los últimos N que muestra el sitio (lo calcula el servidor; después, la acción). */
  enElSitio: boolean;
  esEjemplo: boolean;
  /** Cuántos muestra el sitio (pages.workshops.past.max). */
  max: number;
}) {
  const [foto, setFoto] = useState(inicial);
  const [visible, setVisible] = useState(enElSitio);
  const [subida, setSubida] = useState<Subida | null>(null);
  const [alt, setAlt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<"idle" | "preparando" | "subiendo">("idle");
  const [anuncio, setAnuncio] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [quitando, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const altInput = useRef<HTMLInputElement>(null);
  const id = useId();

  // La vista previa usa una URL temporal: se libera al cambiar o al salir.
  useEffect(() => () => (subida ? URL.revokeObjectURL(subida.preview) : undefined), [subida]);

  function elegir(file: File | undefined) {
    setError(null);
    if (!file) return;
    setSubida({ file, preview: URL.createObjectURL(file) });
    // Al cambiar la foto, la descripción anterior queda como punto de partida.
    setAlt(foto?.alt ?? "");
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
      setError(admin.ui.required + ": " + fotos.alt.toLowerCase());
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
    const resultado = await subirFotoRecuerdo(workshopId, formData);
    setEstado("idle");
    if (!resultado.ok) {
      setError(resultado.fields?.alt ?? resultado.fields?.file ?? resultado.message);
      return;
    }
    const { onSite, ...nueva } = resultado.data;
    setFoto(nueva);
    setVisible(onSite);
    setAnuncio(content.uploaded);
    cancelarSubida();
  }

  function quitar() {
    setConfirmar(false);
    startTransition(async () => {
      const resultado = await quitarFotoRecuerdo(workshopId);
      if (!resultado.ok) {
        setAnuncio(resultado.message);
        return;
      }
      setFoto(null);
      setVisible(false);
      setAnuncio(content.removed);
    });
  }

  const ocupado = estado !== "idle";
  const elegirFoto = (texto: string, principal: boolean) => (
    <label
      className={
        principal
          ? "flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-borde-control p-4 text-center"
          : "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-trazo border-carbon px-5 text-14 font-semibold has-focus-visible:outline-2"
      }
    >
      <span className={`inline-flex items-center gap-2 ${principal ? "font-semibold text-chocolate" : ""}`}>
        <Icono nombre="subir" />
        {texto}
      </span>
      {principal && <span className="text-13 text-secundario">{fotos.addHint}</span>}
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => elegir(event.target.files?.[0])}
        className="sr-only"
      />
    </label>
  );

  return (
    <section aria-labelledby={`${id}-titulo`} className="flex flex-col gap-4 rounded-3xl border border-borde bg-white p-5 lg:p-6">
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-titulo`} className="text-24">
          {content.title}
        </h2>
        <p className="text-14 text-secundario">{esEjemplo ? content.example : content.hint(max)}</p>
      </div>
      <p aria-live="polite" className="sr-only">
        {anuncio}
      </p>

      {!esEjemplo && !subida && (
        <>
          {foto ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-arena sm:w-56">
                <Image src={foto.src} alt={foto.alt} fill sizes="(min-width: 640px) 224px, 90vw" className="object-cover" />
              </div>
              <div className="flex grow flex-col gap-3">
                <p
                  className={`self-start rounded-full px-3 py-1 text-13 font-semibold ${visible ? "bg-exito-fondo text-exito" : "bg-arena text-chocolate"}`}
                >
                  {visible ? content.onSite : content.notInTop(max)}
                </p>
                <p className="text-14">
                  <span className="font-semibold">{fotos.alt}:</span> {foto.alt}
                </p>
                <div className="flex flex-wrap gap-2">
                  {elegirFoto(content.change, false)}
                  <button
                    type="button"
                    onClick={() => !quitando && setConfirmar(true)}
                    aria-disabled={quitando || undefined}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-14 font-semibold text-error underline aria-disabled:opacity-60"
                  >
                    <Icono nombre="borrar" />
                    {content.remove}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-15 text-secundario">{content.noPhoto}</p>
              {elegirFoto(content.add, true)}
            </>
          )}
        </>
      )}

      {subida && (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-borde-control p-4 sm:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:), no pasa por next/image */}
          <img src={subida.preview} alt="" className="aspect-4/3 w-full rounded-xl object-cover sm:w-56" />
          <div className="flex grow flex-col gap-2">
            <label className="flex flex-col gap-1 text-14 font-semibold">
              {fotos.alt} <span className="sr-only">({admin.ui.required})</span>
              <input
                ref={altInput}
                type="text"
                value={alt}
                onChange={(event) => setAlt(event.target.value)}
                required
                maxLength={200}
                aria-invalid={error && !alt.trim() ? true : undefined}
                aria-describedby={`${id}-alt-hint ${id}-error`}
                className="h-11 rounded-lg border border-borde-control px-2.5 text-15 font-normal aria-invalid:border-2 aria-invalid:border-error"
              />
            </label>
            <p id={`${id}-alt-hint`} className="text-13 text-secundario">
              {fotos.altHint}
            </p>
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
                  {estado === "preparando" ? fotos.preparing : estado === "subiendo" ? fotos.uploading : fotos.upload}
                </span>
              </button>
              <button type="button" onClick={cancelarSubida} disabled={ocupado} className="min-h-11 rounded-full px-4 text-14 font-semibold text-carbon underline">
                {fotos.cancelUpload}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmar}
        title={content.removeDialog.title}
        onClose={() => setConfirmar(false)}
        actions={
          <>
            <button type="button" data-autofocus onClick={() => setConfirmar(false)} className="min-h-12 rounded-full border-trazo border-carbon px-5 font-semibold">
              {content.removeDialog.cancel}
            </button>
            <button type="button" onClick={quitar} className="min-h-12 rounded-full bg-error px-5 font-semibold text-white">
              {content.removeDialog.confirm}
            </button>
          </>
        }
      >
        {content.removeDialog.text}
      </ConfirmDialog>
    </section>
  );
}
