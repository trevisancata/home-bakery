// Lo que el carrito necesita en cada página (header incluido) y no depende
// de zod. El esquema (lib/carrito/esquema.ts) se carga aparte, después de
// hidratar: zod pesa ~100 KB y no hace falta para el primer render.

import { pedidos } from "@/data/site";
import type { Linea } from "@/lib/carrito/esquema";

export type { Linea };

export const versionCarrito = 1;
export const claveCarrito = "homebakery:carrito";

/** Una línea por producto + tamaño + sabor + decoración. */
export function claveLinea(linea: Pick<Linea, "productId" | "sizeId" | "flavor" | "decoration">) {
  return [linea.productId, linea.sizeId, linea.flavor ?? "", linea.decoration ?? ""].join("|");
}

export function guardarCarrito(lines: Linea[]) {
  return JSON.stringify({ version: versionCarrito, lines });
}

/** Suma una línea: si ya está la misma combinación, suma la cantidad (con tope). */
export function agregarLinea(lines: Linea[], nueva: Linea): Linea[] {
  const clave = claveLinea(nueva);
  const existente = lines.find((linea) => claveLinea(linea) === clave);
  if (!existente) return lines.length >= pedidos.maxLineas ? lines : [...lines, nueva];
  return lines.map((linea) =>
    linea === existente ? { ...nueva, quantity: Math.min(linea.quantity + nueva.quantity, pedidos.maxCantidad) } : linea,
  );
}

export const totalCarrito = (lines: Linea[]) => lines.reduce((sum, linea) => sum + linea.unitPrice * linea.quantity, 0);
export const unidadesCarrito = (lines: Linea[]) => lines.reduce((sum, linea) => sum + linea.quantity, 0);
