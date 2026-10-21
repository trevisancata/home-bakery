// Estados de un pago de Mercado Pago → los de la tabla pagos.

export const estadosPago = ["pending", "approved", "rejected", "cancelled", "refunded", "in_process"] as const;
export type EstadoPago = (typeof estadosPago)[number];

const equivalencias: Record<string, EstadoPago> = {
  pending: "pending",
  approved: "approved",
  // Autorizado pero sin capturar: todavía no es plata cobrada.
  authorized: "pending",
  in_process: "in_process",
  in_mediation: "in_process",
  rejected: "rejected",
  cancelled: "cancelled",
  refunded: "refunded",
  charged_back: "refunded",
};

/** El estado de la tabla, o null si MP manda uno que no conocemos (no se guarda). */
export function estadoPago(status: string | null | undefined): EstadoPago | null {
  return (status && equivalencias[status]) || null;
}
