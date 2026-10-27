"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import {
  borrarWorkshop,
  type GuardarWorkshopEstado,
  guardarWorkshop,
  ocultarWorkshop,
} from "@/app/admin/(panel)/workshops/actions";
import { Fotos } from "@/components/admin/fotos/Fotos";
import { Aviso, useAviso } from "@/components/admin/ui/Aviso";
import { Campo, CampoArea, CampoSelect, enfocarPrimerError, FilaSwitch } from "@/components/admin/ui/Campos";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { Icono } from "@/components/admin/ui/Icono";
import { Switch } from "@/components/admin/ui/Switch";
import { useAvisoSalir } from "@/components/admin/ui/useAvisoSalir";
import { admin } from "@/data/admin";
import { baDesdeIso, isoDesdeBA } from "@/lib/fecha-ba";
import type { AdminWorkshop } from "@/lib/admin/workshops";
import { workshopCreateSchema } from "@/lib/admin/schemas";
import { parsePrecio, precioParaInput } from "@/lib/precio";

const content = admin.workshops;
const f = content.fields;

type Form = {
  name: string;
  summary: string;
  description: string;
  fecha: string;
  hora: string;
  duration: string;
  price: string;
  capacity: number;
  minimum: string;
  includes: string;
  level: string;
  active: boolean;
  featured: boolean;
  isExample: boolean;
};

function desdeWorkshop(w: AdminWorkshop | null): Form {
  const { fecha, hora } = w ? baDesdeIso(w.startsAt) : { fecha: "", hora: "" };
  return {
    name: w?.name ?? "",
    summary: w?.summary ?? "",
    description: w?.description ?? "",
    fecha,
    hora,
    duration: String(w?.durationMinutes ?? 120),
    price: precioParaInput(w?.price ?? null),
    capacity: w?.capacity ?? 8,
    minimum: String(w?.minimum ?? 4),
    includes: w?.includes ?? "",
    level: w?.level ?? "",
    active: w?.active ?? true,
    featured: w?.featured ?? false,
    isExample: w?.isExample ?? false,
  };
}

const numero = (texto: string) => (texto.trim() === "" ? Number.NaN : Number(texto));

function aDatos(form: Form) {
  const errores: Record<string, string> = {};
  const price = parsePrecio(form.price);
  if (Number.isNaN(price)) errores.price = "Escribí solo números, por ejemplo 30.000.";
  return {
    datos: {
      name: form.name,
      summary: form.summary,
      description: form.description,
      startsAt: isoDesdeBA(form.fecha, form.hora) ?? "",
      durationMinutes: numero(form.duration),
      price: Number.isNaN(price) ? null : price,
      capacity: form.capacity,
      minimum: numero(form.minimum),
      includes: form.includes,
      level: form.level || null,
      active: form.active,
      featured: form.featured,
      isExample: form.isExample,
    },
    errores,
  };
}

/** Crear y editar un workshop (pestaña "Datos" de docs/mockup/admin-workshops.html). */
export function WorkshopForm({ workshop, creado }: { workshop: AdminWorkshop | null; creado: boolean }) {
  const inicial = useMemo(() => desdeWorkshop(workshop), [workshop]);
  const [form, setForm] = useState(inicial);
  const [base, setBase] = useState(() => JSON.stringify(aDatos(inicial).datos));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [dialogo, setDialogo] = useState(false);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const cupoId = useId();
  const { aviso, avisar, cerrar } = useAviso();

  const [, guardar, guardando] = useActionState<GuardarWorkshopEstado, { id: string | null; datos: unknown; snapshot: string }>(
    async (prev, payload) => {
      const resultado = await guardarWorkshop(prev, payload);
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

  const dirty = JSON.stringify(aDatos(form).datos) !== base;
  useAvisoSalir(dirty && !guardando);

  useEffect(() => {
    if (creado) avisar({ texto: content.created });
  }, [creado, avisar]);

  const set = <K extends keyof Form>(campo: K, valor: Form[K]) => setForm((actual) => ({ ...actual, [campo]: valor }));
  const ocupados = workshop?.spotsTaken ?? 0;
  const cupoBajo = form.capacity < ocupados;

  function enviar(event: React.FormEvent) {
    event.preventDefault();
    if (guardando) return;
    const { datos, errores: propios } = aDatos(form);
    const parsed = workshopCreateSchema.safeParse(datos);
    const todos: Record<string, string> = { ...propios };
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const campo = issue.path.join(".");
        if (!todos[campo]) todos[campo] = issue.message;
      }
    }
    if (cupoBajo) todos.capacity = content.capacityTooLow(ocupados);
    if (Object.keys(todos).length > 0) {
      setErrores(todos);
      avisar({ texto: admin.ui.fixErrors, tipo: "error" });
      requestAnimationFrame(() => enfocarPrimerError(formRef.current, Object.keys(todos)));
      return;
    }
    setErrores({});
    startTransition(() => guardar({ id: workshop?.id ?? null, datos, snapshot: JSON.stringify(datos) }));
  }

  const seccion = "flex flex-col gap-4 rounded-3xl border border-borde bg-white p-5 lg:p-6";

  return (
    <>
      <form ref={formRef} noValidate onSubmit={enviar} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <section aria-labelledby="w-datos" className={seccion}>
            <h2 id="w-datos" className="text-24">{content.sections.info}</h2>
            <Campo label={f.name} campo="name" value={form.name} onChange={(e) => set("name", e.target.value)} error={errores.name} required autoComplete="off" />
            <Campo label={f.summary} campo="summary" value={form.summary} onChange={(e) => set("summary", e.target.value)} error={errores.summary} hint={f.summaryHint} />
            <CampoArea label={f.description} campo="description" value={form.description} onChange={(e) => set("description", e.target.value)} error={errores.description} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label={f.date} campo="startsAt" type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} error={errores.startsAt} required />
              <Campo label={f.time} campo="startsAt-hora" type="time" value={form.hora} onChange={(e) => set("hora", e.target.value)} hint={f.timeHint} required />
              <Campo label={f.duration} campo="durationMinutes" type="number" inputMode="numeric" min={15} step={15} value={form.duration} onChange={(e) => set("duration", e.target.value)} error={errores.durationMinutes} />
              <CampoSelect label={f.level} campo="level" value={form.level} onChange={(e) => set("level", e.target.value)} error={errores.level}>
                <option value="">{f.levelNone}</option>
                {f.levels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </CampoSelect>
            </div>
            <CampoArea label={f.includes} campo="includes" value={form.includes} onChange={(e) => set("includes", e.target.value)} error={errores.includes} />
          </section>

          <section aria-labelledby="w-cupo" className={seccion}>
            <h2 id="w-cupo" className="text-24">{content.sections.cupo}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label={f.price} campo="price" inputMode="decimal" placeholder={admin.editor.pricePlaceholder} value={form.price} onChange={(e) => set("price", e.target.value)} error={errores.price} hint={f.priceHint} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span id={`${cupoId}-l`} className="text-14 font-semibold">
                {f.capacity}
              </span>
              <div className="flex items-center gap-2">
                <button type="button" aria-label={f.less} onClick={() => set("capacity", Math.max(1, form.capacity - 1))} disabled={form.capacity <= 1} className="flex size-11 items-center justify-center rounded-full border border-borde-control text-20 disabled:opacity-40">
                  −
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={8}
                  data-campo="capacity"
                  aria-labelledby={`${cupoId}-l`}
                  aria-describedby={`${cupoId}-hint ${cupoId}-error`}
                  aria-invalid={errores.capacity || cupoBajo ? true : undefined}
                  value={form.capacity}
                  onChange={(e) => set("capacity", Math.min(8, Math.max(1, Number(e.target.value) || 1)))}
                  className="h-12 w-20 rounded-xl border border-borde-control bg-white text-center text-16 aria-invalid:border-2 aria-invalid:border-error"
                />
                <button type="button" aria-label={f.more} onClick={() => set("capacity", Math.min(8, form.capacity + 1))} disabled={form.capacity >= 8} className="flex size-11 items-center justify-center rounded-full border border-borde-control text-20 disabled:opacity-40">
                  +
                </button>
              </div>
              <p id={`${cupoId}-hint`} className="text-13 text-secundario">
                {f.capacityHint}
              </p>
              <p id={`${cupoId}-error`} role={cupoBajo ? "alert" : undefined} className="text-13 font-medium text-error">
                {cupoBajo ? content.capacityTooLow(ocupados) : errores.capacity}
              </p>
            </div>
            <Campo label={f.minimum} campo="minimum" type="number" inputMode="numeric" min={1} max={8} value={form.minimum} onChange={(e) => set("minimum", e.target.value)} error={errores.minimum} hint={f.minimumHint} />
          </section>

          {workshop && (
            <section aria-labelledby="w-fotos" className={seccion}>
              <h2 id="w-fotos" className="text-24">{content.sections.photos}</h2>
              <Fotos destino="workshops" ownerId={workshop.id} iniciales={workshop.images} />
            </section>
          )}
        </div>

        <div className="flex flex-col gap-5 lg:sticky lg:top-6">
          <section aria-labelledby="w-vis" className={seccion}>
            <h2 id="w-vis" className="text-24">{content.sections.visibility}</h2>
            <div>
              <FilaSwitch titulo={f.active.label} ayuda={f.active.hint}>
                {(ids) => <Switch checked={form.active} onChange={(v) => set("active", v)} labelledBy={ids.labelledBy} describedBy={ids.describedBy} />}
              </FilaSwitch>
              <FilaSwitch titulo={f.featured.label} ayuda={f.featured.hint}>
                {(ids) => <Switch checked={form.featured} onChange={(v) => set("featured", v)} labelledBy={ids.labelledBy} describedBy={ids.describedBy} />}
              </FilaSwitch>
              <FilaSwitch titulo={f.example.label} ayuda={f.example.hint}>
                {(ids) => <Switch checked={form.isExample} onChange={(v) => set("isExample", v)} labelledBy={ids.labelledBy} describedBy={ids.describedBy} />}
              </FilaSwitch>
            </div>
            {workshop && (
              <a href={`/workshops/${workshop.slug}/inscripcion`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-chocolate underline">
                <Icono nombre="web" size={18} />
                {content.viewInSite}
                <span className="sr-only">{admin.panel.viewSiteContext}</span>
              </a>
            )}
          </section>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {dirty && (
              <span aria-live="polite" className="text-14 font-medium text-secundario">
                {admin.ui.unsaved}
              </span>
            )}
            <Link href="/admin/workshops" className="inline-flex min-h-12 items-center rounded-full border-trazo border-carbon px-5 font-semibold text-carbon no-underline">
              {admin.ui.cancel}
            </Link>
            <button type="submit" aria-disabled={guardando || undefined} className="inline-flex min-h-12 items-center rounded-full bg-chocolate px-6 font-semibold text-hueso aria-disabled:cursor-wait aria-disabled:opacity-80">
              <span aria-live="polite">{guardando ? admin.ui.saving : admin.ui.save}</span>
            </button>
          </div>
          {workshop && (
            <button type="button" onClick={() => setDialogo(true)} className="inline-flex min-h-12 items-center gap-2 self-start rounded-full px-4 font-semibold text-error hover:bg-error-fondo">
              <Icono nombre="borrar" />
              {content.delete}
            </button>
          )}
        </div>
      </form>

      {workshop && (
        <ConfirmDialog
          open={dialogo}
          title={content.deleteDialog.title(workshop.name)}
          onClose={() => setDialogo(false)}
          actions={
            <>
              <button type="button" onClick={() => setDialogo(false)} className="min-h-12 rounded-full px-5 font-semibold underline">
                {content.deleteDialog.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDialogo(false);
                  startTransition(async () => {
                    const resultado = await borrarWorkshop(workshop.id);
                    if (resultado && !resultado.ok) avisar({ texto: resultado.message, tipo: "error" });
                  });
                }}
                className="min-h-12 rounded-full border-trazo border-error px-5 font-semibold text-error"
              >
                {content.deleteDialog.confirm}
              </button>
              <button
                type="button"
                data-autofocus
               
                onClick={() => {
                  setDialogo(false);
                  startTransition(async () => {
                    const resultado = await ocultarWorkshop(workshop.id);
                    if (resultado.ok) {
                      set("active", false);
                      setBase(JSON.stringify(aDatos({ ...form, active: false }).datos));
                      avisar({ texto: admin.ui.saved });
                    } else avisar({ texto: resultado.message, tipo: "error" });
                  });
                }}
                className="min-h-12 rounded-full bg-chocolate px-5 font-semibold text-hueso"
              >
                {content.deleteDialog.hide}
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
