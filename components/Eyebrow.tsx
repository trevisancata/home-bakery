import type { ReactNode } from "react";

type EyebrowProps = {
  children: ReactNode;
  /** 11 px en lugar de 14, como en las tarjetas de producto. */
  small?: boolean;
  /** Color sobre fondos oscuros. */
  tone?: "chocolate" | "crema";
  className?: string;
};

/** Etiqueta corta en mayúsculas que anticipa un título (Oswald, 0.14em). */
export function Eyebrow({ children, small = false, tone = "chocolate", className = "" }: EyebrowProps) {
  return (
    <p
      className={`font-label font-normal tracking-eyebrow uppercase ${small ? "text-11" : "text-14"} ${
        tone === "crema" ? "text-crema" : "text-chocolate"
      } ${className}`}
    >
      {children}
    </p>
  );
}
