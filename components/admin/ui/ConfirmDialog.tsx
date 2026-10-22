"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";

/**
 * Diálogo de confirmación con <dialog> nativo y showModal(): el navegador
 * atrapa el foco adentro, Esc lo cierra y, al cerrarse, el foco vuelve al
 * botón que lo abrió. El foco arranca en la opción segura (cancelar).
 */
export function ConfirmDialog({
  open,
  title,
  children,
  onClose,
  actions,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Botones; el primero con autoFocus recibe el foco. */
  actions: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const retorno = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      retorno.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={textId}
      onClose={() => {
        onClose();
        retorno.current?.focus();
      }}
      onClick={(event) => {
        // Clic en el fondo (fuera de la caja) = cancelar.
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-3xl bg-hueso p-0 text-carbon backdrop:bg-capa/50"
    >
      <div className="flex flex-col gap-4 p-6 lg:p-8">
        <h2 id={titleId} className="text-26 lg:text-30">
          {title}
        </h2>
        <div id={textId} className="leading-parrafo text-secundario">
          {children}
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">{actions}</div>
      </div>
    </dialog>
  );
}
