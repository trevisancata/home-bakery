// external_reference de las preferencias de Mercado Pago: dice de qué es el
// pago. "pedido:<id>" o "inscripcion:<id>". Las inscripciones creadas antes
// de la migración 0007 tienen el id solo (sin prefijo): se leen como
// inscripción.

import { z } from "zod";

export type Referencia = { tipo: "inscripcion" | "pedido"; id: string };

const uuid = z.uuid();

export const referenciaInscripcion = (id: string) => `inscripcion:${id}`;
export const referenciaPedido = (id: string) => `pedido:${id}`;

/** null si no es nuestra (vacía, otro formato o un id que no es uuid). */
export function leerReferencia(ref: string | null | undefined): Referencia | null {
  if (!ref) return null;
  const [prefijo, id] = ref.includes(":") ? ref.split(":", 2) : ["inscripcion", ref];
  if (prefijo !== "inscripcion" && prefijo !== "pedido") return null;
  return uuid.safeParse(id).success ? { tipo: prefijo, id } : null;
}
