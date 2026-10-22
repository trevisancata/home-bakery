"use client";

import { useEffect } from "react";
import { admin } from "@/data/admin";

/**
 * Si hay cambios sin guardar, avisa antes de salir:
 * - al recargar o cerrar la pestaña (beforeunload, con el aviso del navegador);
 * - al tocar un link del sitio (el App Router no tiene una forma oficial de
 *   frenar la navegación, así que se intercepta el clic).
 */
export function useAvisoSalir(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const click = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest("a");
      if (!link || link.target === "_blank" || event.defaultPrevented) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || link.hasAttribute("download")) return;
      if (!window.confirm(admin.ui.leaveConfirm)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
}
