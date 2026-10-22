"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from "react";

type Pestana = { id: string; label: string; contenido: ReactNode };

/**
 * Pestañas accesibles (patrón tablist de ARIA): flechas, Inicio y Fin
 * mueven entre pestañas; solo la activa está en el orden de tabulación. La
 * pestaña elegida queda en la URL (?tab=), para volver al mismo lugar.
 */
export function Pestanas({ label, pestanas, inicial }: { label: string; pestanas: Pestana[]; inicial: string }) {
  const [activa, setActiva] = useState(pestanas.some((p) => p.id === inicial) ? inicial : pestanas[0].id);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const base = useId();

  function elegir(id: string) {
    setActiva(id);
    refs.current[id]?.focus();
    const next = new URLSearchParams(params.toString());
    next.set("tab", id);
    next.delete("creado");
    router.replace(`${pathname}?${next}`, { scroll: false });
  }

  function onKeyDown(event: KeyboardEvent) {
    const i = pestanas.findIndex((p) => p.id === activa);
    const destino =
      event.key === "ArrowRight" ? (i + 1) % pestanas.length
      : event.key === "ArrowLeft" ? (i - 1 + pestanas.length) % pestanas.length
      : event.key === "Home" ? 0
      : event.key === "End" ? pestanas.length - 1
      : null;
    if (destino === null) return;
    event.preventDefault();
    elegir(pestanas[destino].id);
  }

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex gap-2 border-b border-borde">
        {pestanas.map((p) => {
          const seleccionada = p.id === activa;
          return (
            <button
              key={p.id}
              ref={(el) => {
                refs.current[p.id] = el;
              }}
              id={`${base}-tab-${p.id}`}
              type="button"
              role="tab"
              aria-selected={seleccionada}
              aria-controls={`${base}-panel-${p.id}`}
              tabIndex={seleccionada ? 0 : -1}
              onClick={() => elegir(p.id)}
              className={`-mb-px min-h-12 border-b-3 px-4 text-15 ${
                seleccionada ? "border-chocolate font-semibold text-carbon" : "border-transparent text-secundario hover:text-carbon"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {pestanas.map((p) => (
        <div
          key={p.id}
          id={`${base}-panel-${p.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${p.id}`}
          hidden={p.id !== activa}
          tabIndex={0}
          className="focus:outline-none"
        >
          {p.contenido}
        </div>
      ))}
    </div>
  );
}
