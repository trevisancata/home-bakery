import type { ReactNode } from "react";

/** Etiqueta corta en mayúsculas que anticipa un título. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-label text-sm tracking-[0.2em] text-chocolate uppercase ${className}`}>
      {children}
    </p>
  );
}
