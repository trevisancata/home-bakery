import type { ReactNode } from "react";
import { Eyebrow } from "@/components/Eyebrow";

/** Título de cada pantalla del panel: eyebrow, h1 y acciones a la derecha (como el mockup). */
export function Encabezado({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1.5">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="text-36 lg:text-44">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  );
}

/** Contenedor de cada pantalla del panel. */
export function PanelMain({ children }: { children: ReactNode }) {
  return (
    <main id="contenido" tabIndex={-1} className="flex flex-col gap-6 px-4 py-6 focus:outline-none sm:px-6 lg:px-12 lg:py-10">
      {children}
    </main>
  );
}
