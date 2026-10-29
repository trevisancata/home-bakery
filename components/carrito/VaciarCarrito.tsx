"use client";

import { useEffect } from "react";
import { useCarrito } from "@/components/carrito/CarritoProvider";

/** En /pedido/resultado, cuando el pago está aprobado: el pedido ya se hizo, el carrito se vacía. */
export function VaciarCarrito() {
  const { ready, lines, clear } = useCarrito();
  useEffect(() => {
    if (ready && lines.length > 0) clear();
  }, [ready, lines, clear]);
  return null;
}
