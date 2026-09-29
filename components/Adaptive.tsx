import type { ReactNode } from "react";

/**
 * Texto que cambia entre mobile y desktop (desde lg), como en el mockup.
 * La versión oculta usa display: none, así que los lectores de pantalla
 * leen solo la que se ve.
 */
export function Adaptive({ full, short }: { full: ReactNode; short: ReactNode }) {
  return (
    <>
      <span className="lg:hidden">{short}</span>
      <span className="hidden lg:inline">{full}</span>
    </>
  );
}
