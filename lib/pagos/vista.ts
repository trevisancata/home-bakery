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
  venceAt: string;
  pagos: PagoVista[];
};

export type VistaPedido =
  /** Pagado (o ya aceptado o más adelante): pagar no lo confirma, lo confirma Maggie. */
  | { tipo: "pagado" }
  | { tipo: "pendiente"; puedePagar: boolean }
  | { tipo: "rechazada"; vigente: boolean }
  | { tipo: "vencida" }
  | { tipo: "devolucion" }
  | { tipo: "cancelada" };

const pagados = new Set(["pagado", "aceptado", "en_preparacion", "listo", "entregado"]);

export function vistaPedido(pedido: PedidoVista, now = Date.now()): VistaPedido {
  // Pagado gana: un segundo pago que se devuelve (pago_duplicado) no cambia que el pedido está pagado.
  if (pagados.has(pedido.estado)) return { tipo: "pagado" };
  if (pedido.pagos.some((pago) => pago.devolucionPendiente)) return { tipo: "devolucion" };
  if (pedido.estado === "rechazado" || pedido.estado === "cancelado") return { tipo: "cancelada" };
  // pendiente_pago: la misma lógica que una inscripción pendiente.
  const vista = vistaResultado({ estado: "pendiente_sena", venceAt: pedido.venceAt, pagos: pedido.pagos }, now);
  return vista.tipo === "reservada" || vista.tipo === "cancelada" ? { tipo: "cancelada" } : vista;
}
