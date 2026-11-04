"use client";

import { useEffect } from "react";

/**
 * En el celular las pestañas se desplazan de costado: al abrir la página, la
 * actual queda a la vista (si no, "En curso" o "Entregados" quedan fuera).
 */
export function MostrarPestanaActual({ navId }: { navId: string }) {
  useEffect(() => {
    document.getElementById(navId)?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [navId]);
  return null;
}
