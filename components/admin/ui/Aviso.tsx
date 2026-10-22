"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { admin } from "@/data/admin";

export type AvisoDatos = {
  id: number;
  texto: string;
  tipo?: "exito" | "error";
  /** Acción opcional (por ejemplo, "Deshacer"). */
  accion?: { label: string; onClick: () => void };
};

/**
 * Aviso que se cierra solo a los 5 segundos (como pide el mockup para
 * "Deshacer"). Se anuncia con role="status" (o "alert" si es un error), el
 * tiempo se frena mientras el mouse o el foco están encima, y Esc lo cierra.
 */
export function Aviso({ aviso, onClose, ms = 5000 }: { aviso: AvisoDatos | null; onClose: () => void; ms?: number }) {
  const [pausado, setPausado] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aviso || pausado) return;
    const timer = setTimeout(onClose, ms);
    return () => clearTimeout(timer);
  }, [aviso, pausado, ms, onClose]);

  useEffect(() => {
    if (!aviso) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aviso, onClose]);

  const error = aviso?.tipo === "error";
  return (
    // La región existe siempre (vacía si no hay aviso), así el lector de pantalla la anuncia al llenarse.
    <div role={error ? "alert" : "status"} aria-live={error ? "assertive" : "polite"} className="contents">
      {aviso && (
        <div
          ref={ref}
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          onFocus={() => setPausado(true)}
          onBlur={() => setPausado(false)}
          className={`fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-140 items-center justify-between gap-3 rounded-2xl px-4.5 py-2.5 text-15 shadow-lg lg:bottom-8 ${
            error ? "bg-error-fondo text-error" : "bg-exito-fondo text-exito"
          }`}
        >
          <span>{aviso.texto}</span>
          <span className="flex shrink-0 items-center">
            {aviso.accion && (
              <button
                type="button"
                onClick={() => {
                  aviso.accion?.onClick();
                  onClose();
                }}
                className="min-h-11 rounded-full px-3.5 font-semibold underline"
              >
                {aviso.accion.label}
              </button>
            )}
            <button type="button" onClick={onClose} aria-label={admin.ui.close} className="flex size-11 items-center justify-center rounded-full">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

/** Estado de un aviso: avisar("…") lo muestra; cada aviso nuevo reemplaza al anterior. */
export function useAviso() {
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  const avisar = useCallback((datos: Omit<AvisoDatos, "id">) => setAviso({ ...datos, id: Date.now() }), []);
  const cerrar = useCallback(() => setAviso(null), []);
  return { aviso, avisar, cerrar };
}
