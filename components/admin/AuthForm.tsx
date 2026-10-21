"use client";

import { type ComponentProps, type ReactNode, type RefObject, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/admin/actions";

// Piezas de los formularios de acceso (login, recuperación, contraseña nueva).

const inputClass =
  "h-12 w-full rounded-xl border border-borde-control bg-white px-3.5 text-16 font-normal text-carbon aria-invalid:border-2 aria-invalid:border-error";

/** Aviso arriba del formulario. Cuando cambia, recibe el foco para que se lea. */
export function FormAlert({ state }: { state: FormState }) {
  const ref = useRef<HTMLDivElement>(null);
  const message = state.error ?? state.notice;

  useEffect(() => {
    if (message) ref.current?.focus();
  }, [state, message]);

  if (!message) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={state.error ? "alert" : "status"}
      className={`rounded-xl px-3.5 py-3 text-14 ${state.error ? "bg-error-fondo text-error" : "bg-arena text-carbon"}`}
    >
      {message}
    </div>
  );
}

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
} & Omit<ComponentProps<"input">, "name">;

/** Input con label, ayuda y error por campo (aria-invalid + aria-describedby). */
export function Field({ label, name, error, hint, ...input }: FieldProps) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-14 font-semibold">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputClass}
        {...input}
      />
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

/**
 * Botón de envío con estado de carga. Mientras se envía queda con
 * aria-disabled (no disabled, para no perder el foco) y no reenvía.
 */
export function SubmitButton({ children, pending: pendingLabel }: { children: ReactNode; pending: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-disabled={pending || undefined}
      onClick={(event) => {
        if (pending) event.preventDefault();
      }}
      className="inline-flex min-h-13 w-full items-center justify-center rounded-full bg-chocolate px-6 text-15 font-semibold text-hueso transition-colors hover:bg-carbon aria-disabled:cursor-wait aria-disabled:opacity-80"
    >
      <span aria-live="polite">{pending ? pendingLabel : children}</span>
    </button>
  );
}

/** Lleva el foco al primer campo con error después de un envío. */
export function useFocusFirstError(state: FormState, form: RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    const first = state.fields && Object.keys(state.fields)[0];
    if (first) form.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
  }, [state, form]);
}
