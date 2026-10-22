"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  borrarProducto,
  cambiarVisibilidad,
  type GuardarProductoEstado,
  guardarProducto,
} from "@/app/admin/(panel)/productos/actions";
import { Fotos } from "@/components/admin/fotos/Fotos";
import { Aviso, useAviso } from "@/components/admin/ui/Aviso";
import { Campo, CampoArea, CampoLista, CampoSelect, enfocarPrimerError, FilaSwitch } from "@/components/admin/ui/Campos";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { Icono } from "@/components/admin/ui/Icono";
import { Switch } from "@/components/admin/ui/Switch";
import { useAvisoSalir } from "@/components/admin/ui/useAvisoSalir";
import { admin } from "@/data/admin";
import type { AdminProduct } from "@/lib/admin/productos";
import { productoCreateSchema } from "@/lib/admin/schemas";
import { formatPrice } from "@/lib/format";
import { parsePrecio, precioParaInput } from "@/lib/precio";

const content = admin.editor;
const opcionesAnticipacion = ["48", "72", "168"];

type Fila = { key: string; label: string; price: string };

type Form = {
  name: string;
  categoryId: string;
  description: string;
  measure: string;
  servings: string;
  weight: string;
  presentation: string;
  sizes: Fila[];
  active: boolean;
  featured: boolean;
  custom: boolean;
  leadTime: string;
  leadTimeOther: string;
  season: "none" | "some";
  from: number;
  to: number;
  flavors: string[];
  decorations: string[];
};

let siguienteKey = 0;
const nuevaFila = (label = "", price = ""): Fila => ({ key: `f${siguienteKey++}`, label, price });

function desdeProducto(p: AdminProduct | null): Form {
  const lead = String(p?.leadTimeHours ?? 48);
  return {
    name: p?.name ?? "",
    categoryId: p?.category.id ?? "",
    description: p?.description ?? "",
    measure: p?.measure ?? "",
    servings: p?.servings ?? "",
    weight: p?.weight ?? "",
    presentation: p?.presentation ?? "",
    sizes: p && p.sizes.length > 0 ? p.sizes.map((s) => nuevaFila(s.label, precioParaInput(s.price))) : [nuevaFila()],
    active: p?.active ?? true,
    featured: p?.featured ?? false,
    custom: p?.custom ?? false,
    leadTime: opcionesAnticipacion.includes(lead) ? lead : "otra",
    leadTimeOther: opcionesAnticipacion.includes(lead) ? "" : lead,
    season: p?.season ? "some" : "none",
    from: p?.season?.from ?? 1,
    to: p?.season?.to ?? 12,
    flavors: p?.flavors ?? [],
    decorations: p?.decorations ?? [],
  };
}

/** Lo que espera el esquema zod (el mismo que valida el servidor). */
function aDatos(form: Form) {
  const errores: Record<string, string> = {};
  const sizes = form.sizes
    .filter((fila) => fila.label.trim() || fila.price.trim())
    .map((fila, index) => {
      const price = parsePrecio(fila.price);
      if (Number.isNaN(price)) errores[`sizes.${index}.price`] = "Escribí solo números, por ejemplo 12.500.";
      return { label: fila.label, price: Number.isNaN(price) ? null : price };
    });
  const leadTimeHours = Number(form.leadTime === "otra" ? form.leadTimeOther : form.leadTime);
  return {
    datos: {
      name: form.name,
      categoryId: form.categoryId,
      description: form.description,
      measure: form.measure,
      servings: form.servings,
      weight: form.weight,
      presentation: form.presentation,
      sizes,
      active: form.active,
      featured: form.featured,
      custom: form.custom,
      leadTimeHours: Number.isFinite(leadTimeHours) ? leadTimeHours : -1,
      season: form.season === "some" ? { from: form.from, to: form.to } : null,
      flavors: form.flavors,
      decorations: form.decorations,
    },
    errores,
  };
}

/**
 * Crear y editar un producto (docs/mockup/admin-editar-producto*.html).
 * Valida en el navegador con el mismo esquema zod que el servidor, lleva el
 * foco al primer error y avisa si se sale con cambios sin guardar.
 */
export function ProductoForm({
  producto,
  categorias,
  creado,
}: {
  producto: AdminProduct | null;
  categorias: { id: string; name: string }[];
  creado: boolean;
}) {
  const inicial = useMemo(() => desdeProducto(producto), [producto]);
  const [form, setForm] = useState(inicial);
  const [base, setBase] = useState(() => JSON.stringify(aDatos(inicial).datos));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const { aviso, avisar, cerrar } = useAviso();

  // useActionState con la Server Action; el resultado se procesa acá mismo
  // (dentro de la transición), no en un efecto.
  const [, guardar, guardando] = useActionState<GuardarProductoEstado, { id: string | null; datos: unknown; snapshot: string }>(
    async (prev, payload) => {
      const resultado = await guardarProducto(prev, payload);
      if (resultado?.ok) {
        setErrores({});
        setBase(payload.snapshot);
        avisar({ texto: admin.ui.saved });
      } else if (resultado) {
        setErrores(resultado.fields ?? {});
        avisar({ texto: resultado.message, tipo: "error" });
        requestAnimationFrame(() => enfocarPrimerError(formRef.current, Object.keys(resultado.fields ?? {})));
      }
      return resultado;
    },
    null,
  );
  const [borrarAbierto, setBorrarAbierto] = useState(false);
  const [, startTransition] = useTransition();

  const dirty = JSON.stringify(aDatos(form).datos) !== base;
  useAvisoSalir(dirty && !guardando);

  useEffect(() => {
    if (creado) avisar({ texto: content.created });
  }, [creado, avisar]);


  const set = <K extends keyof Form>(campo: K, valor: Form[K]) => setForm((f) => ({ ...f, [campo]: valor }));

  function setFila(index: number, cambios: Partial<Fila>) {
    setForm((f) => ({ ...f, sizes: f.sizes.map((fila, i) => (i === index ? { ...fila, ...cambios } : fila)) }));
  }

  function moverFila(index: number, delta: -1 | 1) {
    setForm((f) => {
      const sizes = [...f.sizes];
      const j = index + delta;
      if (j < 0 || j >= sizes.length) return f;
      [sizes[index], sizes[j]] = [sizes[j], sizes[index]];
      return { ...f, sizes };
    });
  }

  function enviar(event: React.FormEvent) {
    event.preventDefault();
    if (guardando) return;
    const { datos, errores: propios } = aDatos(form);
    const parsed = productoCreateSchema.safeParse(datos);
    const todos: Record<string, string> = { ...propios };
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const campo = issue.path.join(".");
        if (!todos[campo]) todos[campo] = issue.message;
      }
    }
    if (Object.keys(todos).length > 0) {
      setErrores(todos);
      avisar({ texto: admin.ui.fixErrors, tipo: "error" });
      requestAnimationFrame(() => enfocarPrimerError(formRef.current, Object.keys(todos)));
      return;
    }
    setErrores({});
    startTransition(() => guardar({ id: producto?.id ?? null, datos, snapshot: JSON.stringify(datos) }));
  }

  // Vista previa de la tarjeta de la tienda.
  const precios = aDatos(form).datos.sizes.map((s) => s.price).filter((p): p is number => p !== null);
  const portada = producto?.images.find((img) => img.cover) ?? producto?.images[0];
  const nombre = form.name.trim() || content.titleNew;

  const botones = (
    <>
      {dirty && (
        <span aria-live="polite" className="self-center text-14 font-medium text-secundario">
          {admin.ui.unsaved}
        </span>
      )}
      <Link href="/admin/productos" className="inline-flex min-h-12 items-center rounded-full border-trazo border-carbon px-5 font-semibold text-carbon no-underline">
        {admin.ui.cancel}
      </Link>
      <button
        type="submit"
        form="producto-form"
        aria-disabled={guardando || undefined}
        className="inline-flex min-h-12 items-center rounded-full bg-chocolate px-6 font-semibold text-hueso aria-disabled:cursor-wait aria-disabled:opacity-80"
      >
        <span aria-live="polite">{guardando ? admin.ui.saving : admin.ui.save}</span>
      </button>
    </>
  );

  const seccion = "flex flex-col gap-4 rounded-3xl border border-borde bg-white p-5 lg:p-6";

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <nav aria-label={admin.editor.breadcrumb} className="flex items-center gap-1 text-14 text-secundario">
            <Link href="/admin/productos" className="flex min-h-11 items-center gap-1 text-secundario underline hover:text-carbon">
              <Icono nombre="volver" size={16} />
              {content.breadcrumb}
            </Link>
          </nav>
          <h1 className="text-36 lg:text-44">{producto ? producto.name : content.titleNew}</h1>
        </div>
        <div className="hidden flex-wrap gap-3 lg:flex">{botones}</div>
      </div>

      <form id="producto-form" ref={formRef} noValidate onSubmit={enviar} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <section aria-labelledby="s-fotos" className={seccion}>
            <h2 id="s-fotos" className="text-24">{content.sections.photos}</h2>
            {producto ? (
              <Fotos destino="productos" ownerId={producto.id} iniciales={producto.images} conSabor />
            ) : (
              <p className="text-15 text-secundario">{content.photosFirst}</p>
            )}
          </section>

          <section aria-labelledby="s-info" className={seccion}>
            <h2 id="s-info" className="text-24">{content.sections.info}</h2>
            <Campo label={content.fields.name} campo="name" value={form.name} onChange={(e) => set("name", e.target.value)} error={errores.name} required autoComplete="off" />
            <CampoSelect label={content.fields.category} campo="categoryId" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} error={errores.categoryId} required>
              <option value="">{content.fields.categoryPlaceholder}</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </CampoSelect>
            <CampoArea label={content.fields.description} campo="description" value={form.description} onChange={(e) => set("description", e.target.value)} error={errores.description} hint={content.fields.descriptionHint} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label={content.fields.measure} campo="measure" value={form.measure} onChange={(e) => set("measure", e.target.value)} error={errores.measure} />
              <Campo label={content.fields.servings} campo="servings" value={form.servings} onChange={(e) => set("servings", e.target.value)} error={errores.servings} />
              <Campo label={content.fields.weight} campo="weight" value={form.weight} onChange={(e) => set("weight", e.target.value)} error={errores.weight} />
              <Campo label={content.fields.presentation} campo="presentation" value={form.presentation} onChange={(e) => set("presentation", e.target.value)} error={errores.presentation} hint={content.fields.presentationHint} />
            </div>
          </section>

          <section aria-labelledby="s-precio" className={seccion}>
            <h2 id="s-precio" className="text-24">{content.sections.sizes}</h2>
            <p className="text-14 text-secundario">{content.sizesHint}</p>
            {errores.sizes && <p className="text-13 font-medium text-error">{errores.sizes}</p>}
            <ol className="flex flex-col gap-3">
              {form.sizes.map((fila, index) => {
                const n = index + 1;
                return (
                  <li key={fila.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
                    <Campo label={content.size(n)} campo={`sizes.${index}.label`} value={fila.label} onChange={(e) => setFila(index, { label: e.target.value })} error={errores[`sizes.${index}.label`]} className="col-span-2 sm:col-span-1" />
                    <Campo label={content.price(n)} campo={`sizes.${index}.price`} value={fila.price} onChange={(e) => setFila(index, { price: e.target.value })} error={errores[`sizes.${index}.price`]} inputMode="decimal" placeholder={content.pricePlaceholder} />
                    <div className="flex items-center self-end pb-0.5">
                      <button type="button" onClick={() => moverFila(index, -1)} disabled={index === 0} aria-label={content.moveUp(n)} className="flex size-11 items-center justify-center rounded-full hover:bg-arena disabled:opacity-40">
                        <Icono nombre="arriba" />
                      </button>
                      <button type="button" onClick={() => moverFila(index, 1)} disabled={index === form.sizes.length - 1} aria-label={content.moveDown(n)} className="flex size-11 items-center justify-center rounded-full hover:bg-arena disabled:opacity-40">
                        <Icono nombre="abajo" />
                      </button>
                      <button type="button" onClick={() => set("sizes", form.sizes.length === 1 ? [nuevaFila()] : form.sizes.filter((_, i) => i !== index))} aria-label={content.removeSize(n)} className="flex size-11 items-center justify-center rounded-full text-error hover:bg-error-fondo">
                        <Icono nombre="borrar" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
            <button type="button" onClick={() => set("sizes", [...form.sizes, nuevaFila()])} className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border-trazo border-carbon px-4 text-14 font-semibold">
              <Icono nombre="mas" size={18} />
              {content.addSize}
            </button>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section aria-labelledby="s-vis" className={seccion}>
            <h2 id="s-vis" className="text-24">{content.sections.visibility}</h2>
            <div>
              <FilaSwitch titulo={content.visibility.active.label} ayuda={content.visibility.active.hint}>
                {(ids) => <Switch checked={form.active} onChange={(v) => set("active", v)} labelledBy={ids.labelledBy} describedBy={ids.describedBy} />}
              </FilaSwitch>
              <FilaSwitch titulo={content.visibility.featured.label} ayuda={content.visibility.featured.hint}>
                {(ids) => <Switch checked={form.featured} onChange={(v) => set("featured", v)} labelledBy={ids.labelledBy} describedBy={ids.describedBy} />}
              </FilaSwitch>
              <FilaSwitch titulo={content.visibility.custom.label} ayuda={content.visibility.custom.hint}>
                {(ids) => <Switch checked={form.custom} onChange={(v) => set("custom", v)} labelledBy={ids.labelledBy} describedBy={ids.describedBy} />}
              </FilaSwitch>
            </div>
            {producto && (
              <p className="text-14">
                <a href={`/tienda/${producto.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-chocolate underline">
                  <Icono nombre="web" size={18} />
                  {content.viewInStore}
                  <span className="sr-only">{admin.panel.viewSiteContext}</span>
                </a>
                {!producto.active && <span className="block text-13 text-secundario">{content.viewInStorePaused}</span>}
              </p>
            )}
          </section>

          <section aria-labelledby="s-enc" className={seccion}>
            <h2 id="s-enc" className="text-24">{content.sections.order}</h2>
            <CampoSelect label={content.leadTime.label} campo="leadTimeHours" value={form.leadTime} onChange={(e) => set("leadTime", e.target.value)} hint={content.leadTime.hint} error={form.leadTime === "otra" ? undefined : errores.leadTimeHours}>
              {content.leadTime.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </CampoSelect>
            {form.leadTime === "otra" && (
              <Campo label={content.leadTime.other} campo="leadTimeHours" type="number" min={0} inputMode="numeric" value={form.leadTimeOther} onChange={(e) => set("leadTimeOther", e.target.value)} error={errores.leadTimeHours} />
            )}
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 text-14 font-semibold">{content.season.label}</legend>
              {(["none", "some"] as const).map((v) => (
                <label key={v} className="flex min-h-11 items-center gap-3 text-15">
                  <input type="radio" name="temporada" checked={form.season === v} onChange={() => set("season", v)} className="size-5 accent-chocolate" />
                  {v === "none" ? content.season.none : content.season.some}
                </label>
              ))}
              {form.season === "some" && (
                <div className="grid grid-cols-2 gap-3">
                  <CampoSelect label={content.season.from} campo="season.from" value={String(form.from)} onChange={(e) => set("from", Number(e.target.value))} error={errores["season.from"]}>
                    {content.months.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </CampoSelect>
                  <CampoSelect label={content.season.to} campo="season.to" value={String(form.to)} onChange={(e) => set("to", Number(e.target.value))} error={errores["season.to"]}>
                    {content.months.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </CampoSelect>
                </div>
              )}
              <p className="text-13 text-secundario">{content.season.hint}</p>
            </fieldset>
            <CampoLista label={content.flavors.label} campo="flavors" valores={form.flavors} onChange={(v) => set("flavors", v)} agregar={content.flavors.add} quitar={content.flavors.remove} placeholder={content.flavors.placeholder} error={errores.flavors} />
            <CampoLista label={content.decorations.label} campo="decorations" valores={form.decorations} onChange={(v) => set("decorations", v)} agregar={content.decorations.add} quitar={content.decorations.remove} placeholder={content.decorations.placeholder} error={errores.decorations} />
          </section>

          <section aria-labelledby="s-prev" className={seccion}>
            <h2 id="s-prev" className="text-24">{content.sections.preview}</h2>
            <div className="flex flex-col gap-3 rounded-2xl bg-hueso p-3">
              {portada ? (
                <Image src={portada.src} alt="" width={portada.width} height={portada.height} sizes="320px" className="aspect-4/5 w-full rounded-xl object-cover" />
              ) : (
                <span className="flex aspect-4/5 w-full items-end rounded-xl bg-placeholder p-3 text-12 font-medium tracking-foto text-chocolate uppercase">
                  {content.previewNoPhoto}
                </span>
              )}
              <strong className="text-17">{nombre}</strong>
              <span className="text-15 text-secundario">
                {precios.length > 0 ? content.from(formatPrice(Math.min(...precios))) : content.priceTbd}
              </span>
            </div>
            <p className="text-13 text-secundario">{content.previewHint}</p>
          </section>
        </div>
      </form>

      {/* Mobile: Cancelar y Guardar siempre a mano, arriba de la barra de abajo. */}
      <div className="sticky bottom-22 z-20 -mx-4 flex flex-wrap justify-end gap-3 border-t border-borde bg-hueso/95 px-4 py-3 lg:hidden">{botones}</div>

      {producto && (
        <button
          type="button"
          onClick={() => setBorrarAbierto(true)}
          className="inline-flex min-h-12 items-center gap-2 self-start rounded-full px-4 font-semibold text-error hover:bg-error-fondo"
        >
          <Icono nombre="borrar" />
          {content.delete}
        </button>
      )}

      {producto && (
        <ConfirmDialog
          open={borrarAbierto}
          title={content.deleteDialog.title(producto.name)}
          onClose={() => setBorrarAbierto(false)}
          actions={
            <>
              <button type="button" onClick={() => setBorrarAbierto(false)} className="min-h-12 rounded-full px-5 font-semibold underline">
                {content.deleteDialog.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBorrarAbierto(false);
                  startTransition(async () => {
                    const resultado = await borrarProducto(producto.id, producto.name);
                    if (resultado && !resultado.ok) avisar({ texto: resultado.message, tipo: "error" });
                  });
                }}
                className="min-h-12 rounded-full border-trazo border-error px-5 font-semibold text-error"
              >
                {content.deleteDialog.confirm}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setBorrarAbierto(false);
                  startTransition(async () => {
                    const resultado = await cambiarVisibilidad(producto.id, false);
                    if (resultado.ok) {
                      set("active", false);
                      setBase(JSON.stringify(aDatos({ ...form, active: false }).datos));
                      avisar({ texto: admin.productos.pausedToast(producto.name) });
                    } else {
                      avisar({ texto: resultado.message, tipo: "error" });
                    }
                  });
                }}
                className="min-h-12 rounded-full bg-chocolate px-5 font-semibold text-hueso"
              >
                {content.deleteDialog.pause}
              </button>
            </>
          }
        >
          {content.deleteDialog.text}
        </ConfirmDialog>
      )}

      <Aviso aviso={aviso} onClose={cerrar} />
    </>
  );
}
