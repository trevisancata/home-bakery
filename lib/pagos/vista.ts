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

/* -------------------------------------------------------------------------- */
/* Pedidos de la tienda                                                       */
/* -------------------------------------------------------------------------- */

export type PedidoVista = {
  estado: "pendiente_pago" | "pagado" | "aceptado" | "en_preparacion" | "listo" | "entregado" | "rechazado" | "cancelado" | string;
  medioPago: "mercadopago" | "transferencia" | "efectivo";
  /** null con efectivo: no vence. */
  venceAt: string | null;
  /** Pago marcado a mano por la admin (transferencia o efectivo). */
  pagadoAt: string | null;
  /** Devolución manual pendiente (transferencia o efectivo); las de MP están en pagos. */
  devolucionPendiente: boolean;
  pagos: PagoVista[];
};

export type VistaPedido =
  /** Pagado (o ya aceptado o más adelante): pagar no lo confirma, lo confirma Maggie. */
  | { tipo: "pagado" }
  /** Transferencia sin registrar y dentro del plazo: se muestran los datos de la cuenta. */
  | { tipo: "transferencia"; venceAt: string }
  /** Efectivo sin cobrar: se paga al retirar (aunque Maggie ya lo haya aceptado). */
  | { tipo: "efectivo" }
  | { tipo: "pendiente"; puedePagar: boolean }
  | { tipo: "rechazada"; vigente: boolean }
  | { tipo: "vencida" }
  | { tipo: "devolucion" }
  | { tipo: "cancelada" };

const pagados = new Set(["pagado", "aceptado", "en_preparacion", "listo", "entregado"]);

export function vistaPedido(pedido: PedidoVista, now = Date.now()): VistaPedido {
  const anulado = pedido.estado === "rechazado" || pedido.estado === "cancelado";
  // Efectivo: hasta que se cobra, el pedido (aceptado o no) se paga al retirar.
  if (pedido.medioPago === "efectivo" && !pedido.pagadoAt && !anulado) return { tipo: "efectivo" };
  // Pagado gana: un segundo pago que se devuelve (pago_duplicado) no cambia que el pedido está pagado.
  if (pagados.has(pedido.estado)) return { tipo: "pagado" };
  if (pedido.devolucionPendiente || pedido.pagos.some((pago) => pago.devolucionPendiente)) return { tipo: "devolucion" };
  if (anulado) return { tipo: "cancelada" };
  if (pedido.medioPago !== "mercadopago") {
    // Transferencia sin registrar: vence a las 24 h (para la clienta; la admin puede registrarla igual).
    const vigente = pedido.venceAt !== null && new Date(pedido.venceAt).getTime() > now;
    return vigente && pedido.venceAt ? { tipo: "transferencia", venceAt: pedido.venceAt } : { tipo: "vencida" };
  }
  // pendiente_pago: la misma lógica que una inscripción pendiente.
  const vista = vistaResultado({ estado: "pendiente_sena", venceAt: pedido.venceAt ?? "", pagos: pedido.pagos }, now);
  return vista.tipo === "reservada" || vista.tipo === "cancelada" ? { tipo: "cancelada" } : vista;
}
