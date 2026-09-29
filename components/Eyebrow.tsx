import type { ReactNode } from "react";

/** Etiqueta corta en mayúsculas que anticipa un título (Oswald 14 px, 0.14em). */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-label text-14 font-normal tracking-eyebrow text-chocolate uppercase ${className}`}>
      {children}
    </p>
  );
}
