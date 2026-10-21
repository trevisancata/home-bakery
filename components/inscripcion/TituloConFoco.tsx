"use client";

import { type ReactNode, useEffect, useRef } from "react";

/**
 * h1 que recibe el foco al cargar: quien vuelve de Mercado Pago con lector
 * de pantalla escucha primero el resultado del pago.
 */
export function TituloConFoco({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <h1 ref={ref} tabIndex={-1} className={`focus:outline-none ${className}`}>
      {children}
    </h1>
  );
}
