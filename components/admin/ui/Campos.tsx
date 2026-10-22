"use client";

import { type ComponentProps, type ReactNode, useId, useState } from "react";
import { Icono } from "@/components/admin/ui/Icono";

// Campos de los formularios del panel: label visible, ayuda y error
// asociados (aria-describedby) y aria-invalid. El `name` es la clave del
// error (por ejemplo "sizes.1.price"): lo usa el formulario para llevar el
// foco al primer campo con error (data-campo).

const control =
  "w-full rounded-xl border border-borde-control bg-white px-3.5 text-16 font-normal text-carbon aria-invalid:border-2 aria-invalid:border-error";

type Base = { label: ReactNode; campo: string; error?: string; hint?: ReactNode; labelOculto?: boolean; className?: string };

function Envoltorio({
  id,
  label,
  error,
  hint,
  labelOculto,
  className = "",
  children,
}: Base & { id: string; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={labelOculto ? "sr-only" : "text-14 font-semibold"}>
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-13 text-secundario">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-13 font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint: unknown, error: unknown) {
  return [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
}

export function Campo({ label, campo, error, hint, labelOculto, className, ...input }: Base & Omit<ComponentProps<"input">, "className">) {
  const id = useId();
  return (
    <Envoltorio id={id} label={label} campo={campo} error={error} hint={hint} labelOculto={labelOculto} className={className}>
      <input
        id={id}
        data-campo={campo}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${control} h-12`}
        {...input}
      />
    </Envoltorio>
  );
}

export function CampoArea({ label, campo, error, hint, className, ...textarea }: Base & Omit<ComponentProps<"textarea">, "className">) {
  const id = useId();
  return (
    <Envoltorio id={id} label={label} campo={campo} error={error} hint={hint} className={className}>
      <textarea
        id={id}
        data-campo={campo}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        rows={4}
        className={`${control} py-3 leading-medio`}
        {...textarea}
      />
    </Envoltorio>
  );
}

export function CampoSelect({
  label,
  campo,
  error,
  hint,
  className,
  children,
  ...select
}: Base & Omit<ComponentProps<"select">, "className">) {
  const id = useId();
  return (
    <Envoltorio id={id} label={label} campo={campo} error={error} hint={hint} className={className}>
      <select
        id={id}
        data-campo={campo}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${control} h-12`}
        {...select}
      >
        {children}
      </select>
    </Envoltorio>
  );
}

/** Lista de textos cortos (sabores, decoraciones) con agregar y quitar. */
export function CampoLista({
  label,
  campo,
  valores,
  onChange,
  agregar,
  quitar,
  placeholder,
  error,
}: {
  label: string;
  campo: string;
  valores: string[];
  onChange: (valores: string[]) => void;
  agregar: string;
  quitar: (valor: string) => string;
  placeholder: string;
  error?: string;
}) {
  const [nuevo, setNuevo] = useState("");
  const id = useId();
  function sumar() {
    const valor = nuevo.trim();
    if (!valor || valores.some((v) => v.toLowerCase() === valor.toLowerCase())) return;
    onChange([...valores, valor]);
    setNuevo("");
  }
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-14 font-semibold">{label}</legend>
      {valores.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {valores.map((valor) => (
            <li key={valor} className="flex items-center rounded-full bg-arena pl-3.5 text-14">
              {valor}
              <button
                type="button"
                onClick={() => onChange(valores.filter((v) => v !== valor))}
                aria-label={quitar(valor)}
                className="flex size-11 items-center justify-center rounded-full"
              >
                <Icono nombre="cerrar" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <label htmlFor={id} className="sr-only">
          {agregar}
        </label>
        <input
          id={id}
          data-campo={campo}
          type="text"
          value={nuevo}
          placeholder={placeholder}
          onChange={(event) => setNuevo(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              sumar();
            }
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${control} h-11`}
        />
        <button type="button" onClick={sumar} className="min-h-11 shrink-0 rounded-full border-trazo border-carbon px-4 text-14 font-semibold">
          {agregar}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-13 font-medium text-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Fila con un switch: título, ayuda y el interruptor (como "Visibilidad" del mockup). */
export function FilaSwitch({ titulo, ayuda, children }: { titulo: string; ayuda: string; children: (ids: { labelledBy: string; describedBy: string }) => ReactNode }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 border-b border-borde-suave py-3 last:border-0">
      <div className="flex flex-col gap-0.5">
        <strong id={`${id}-t`} className="text-15">
          {titulo}
        </strong>
        <span id={`${id}-d`} className="text-13 text-secundario">
          {ayuda}
        </span>
      </div>
      {children({ labelledBy: `${id}-t`, describedBy: `${id}-d` })}
    </div>
  );
}

/** Lleva el foco al primer campo con error, en el orden en que aparecen. */
export function enfocarPrimerError(form: HTMLElement | null, campos: string[]) {
  if (!form || campos.length === 0) return;
  const elementos = [...form.querySelectorAll<HTMLElement>("[data-campo]")];
  const primero = elementos.find((el) => campos.includes(el.dataset.campo ?? ""));
  primero?.focus();
}
