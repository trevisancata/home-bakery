"use client";

import { useEffect, useState } from "react";
import { pages } from "@/data/site";

const content = pages.pedidoResultado.transfer;

type Estado = "idle" | "copiado" | "error";

/**
 * Botón "Copiar" de un dato de la transferencia (alias, CBU, monto…). El
 * resultado se anuncia en una región aria-live; si el navegador no deja
 * copiar (permisos, http), avisa que se copie a mano.
 */
export function CopiarDato({ dato, valor }: { dato: string; valor: string }) {
  const [estado, setEstado] = useState<Estado>("idle");

  // El "Copiado" se va solo, así se puede volver a copiar y anunciar.
  useEffect(() => {
    if (estado !== "copiado") return;
    const timer = setTimeout(() => setEstado("idle"), 3000);
    return () => clearTimeout(timer);
  }, [estado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setEstado("copiado");
    } catch {
      setEstado("error");
    }
  }

  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={copiar}
        className="h-11 shrink-0 rounded-full border-trazo border-carbon px-4 text-14 font-semibold text-carbon hover:bg-chocolate hover:text-hueso"
      >
        {content.copy}
        <span className="sr-only">{content.copyContext(dato)}</span>
      </button>
      <span aria-live="polite" className="text-13 text-secundario">
        {estado === "copiado" && content.copied(dato)}
        {estado === "error" && <span className="font-medium text-error">{content.copyFailed}</span>}
      </span>
    </span>
  );
}
