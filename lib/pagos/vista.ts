// Qué ve quien vuelve de Mercado Pago, a partir del estado real de la base
// (nunca de los query params que manda MP en la back_url).

export type PagoVista = { estado: string; devolucionPendiente: boolean; createdAt: string };

export type InscripcionVista = {
  estado: "pendiente_sena" | "reservada" | "cancelada" | string;
  venceAt: string;
  pagos: PagoVista[];
};

export type Vista =
  | { tipo: "reservada" }
  /** Pago en proceso, o todavía sin pago y la reserva vigente (puede pagar). */
  | { tipo: "pendiente"; puedePagar: boolean }
  | { tipo: "rechazada"; vigente: boolean }
  | { tipo: "vencida" }
  | { tipo: "devolucion" }
  | { tipo: "cancelada" };

export function vistaResultado(inscripcion: InscripcionVista, now = Date.now()): Vista {
  const vigente = new Date(inscripcion.venceAt).getTime() > now;
  if (inscripcion.estado === "reservada") return { tipo: "reservada" };
  if (inscripcion.pagos.some((pago) => pago.devolucionPendiente)) return { tipo: "devolucion" };
  if (inscripcion.estado === "cancelada") return { tipo: "cancelada" };

  // pendiente_sena: manda el último pago.
  const [ultimo] = [...inscripcion.pagos].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (ultimo && (ultimo.estado === "pending" || ultimo.estado === "in_process")) {
    return { tipo: "pendiente", puedePagar: false };
  }
  if (ultimo && (ultimo.estado === "rejected" || ultimo.estado === "cancelled")) {
    return { tipo: "rechazada", vigente };
  }
  return vigente ? { tipo: "pendiente", puedePagar: true } : { tipo: "vencida" };
}
