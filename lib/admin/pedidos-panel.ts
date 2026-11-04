// Lógica del panel de pedidos sin acceso a la base: en qué pestaña va cada
// pedido, cómo se agrupan, qué se dice del pago, el historial y el mensaje de
// WhatsApp. Pura, así la prueban los unitarios.

import { admin } from "@/data/admin";
import { pages } from "@/data/site";
import { formatDay, formatPrice, formatShortDateTime } from "@/lib/format";
import { fechaBA, inicioFranja, sumarDias } from "@/lib/pedidos/reglas";
import { waLink } from "@/lib/whatsapp-numero";

const content = admin.pedidos;

export type MedioPago = "mercadopago" | "transferencia" | "efectivo";

export type PagoMp = {
  id: string;
  mpPaymentId: string;
  estado: string;
  monto: number;
  devolucionPendiente: boolean;
  motivoDevolucion: string | null;
  devueltoAt: string | null;
  createdAt: string;
};

export type PedidoPanel = {
  id: string;
  numero: number;
  nombre: string;
  email: string;
  telefono: string;
  entrega: "retiro" | "envio";
  direccion: string | null;
  localidad: string | null;
  fecha: string;
  franja: string;
  notas: string | null;
  total: number;
  estado: string;
  medioPago: MedioPago;
  venceAt: string | null;
  createdAt: string;
  pagadoAt: string | null;
  pagadoPor: string | null;
  aceptadoAt: string | null;
  enPreparacionAt: string | null;
  listoAt: string | null;
  entregadoAt: string | null;
  rechazadoAt: string | null;
  canceladoAt: string | null;
  motivoRechazo: string | null;
  motivoCancelacion: string | null;
  devolucionPendiente: boolean;
  devueltoAt: string | null;
  /** Suma de las cantidades de los ítems. */
  unidades: number;
  pagos: PagoMp[];
};

export const pestanas = ["por_confirmar", "esperando_transferencia", "en_curso", "entregados", "rechazados"] as const;
export type Pestana = (typeof pestanas)[number];

export const enCurso = new Set(["aceptado", "en_preparacion", "listo"]);

/** Pendiente de pago con el plazo vencido (efectivo no vence). */
export function vencido(pedido: Pick<PedidoPanel, "estado" | "venceAt">, now = Date.now()) {
  return pedido.estado === "pendiente_pago" && pedido.venceAt !== null && new Date(pedido.venceAt).getTime() <= now;
}

/**
 * La pestaña de un pedido, o null si no hay nada que mirar todavía (un pago
 * de Mercado Pago en curso, dentro de sus 30 minutos).
 */
export function pestanaDe(pedido: PedidoPanel, now = Date.now()): Pestana | null {
  const { estado, medioPago } = pedido;
  if (estado === "pagado" || (medioPago === "efectivo" && estado === "pendiente_pago")) return "por_confirmar";
  if (medioPago === "transferencia" && estado === "pendiente_pago") return "esperando_transferencia";
  if (enCurso.has(estado)) return "en_curso";
  if (estado === "entregado") return "entregados";
  if (estado === "rechazado" || estado === "cancelado") return "rechazados";
  // Mercado Pago sin pagar: vencido ya no se completa; vigente, la clienta está pagando.
  return vencido(pedido, now) ? "rechazados" : null;
}

/** Por fecha y franja de retiro o entrega (el primero, el más próximo). */
export function porTurno(a: PedidoPanel, b: PedidoPanel) {
  return inicioFranja(a.fecha, a.franja) - inicioFranja(b.fecha, b.franja) || a.numero - b.numero;
}

/** Los pedidos de cada pestaña, ordenados por turno (entregados y rechazados, del más reciente). */
export function porPestana(lista: PedidoPanel[], now = Date.now()) {
  const grupos = Object.fromEntries(pestanas.map((p) => [p, [] as PedidoPanel[]])) as Record<Pestana, PedidoPanel[]>;
  for (const pedido of lista) {
    const pestana = pestanaDe(pedido, now);
    if (pestana) grupos[pestana].push(pedido);
  }
  for (const pestana of pestanas) {
    grupos[pestana].sort(porTurno);
    if (pestana === "entregados" || pestana === "rechazados") grupos[pestana].reverse();
  }
  return grupos;
}

/** "Hoy", "Mañana" o la fecha, en hora de Buenos Aires. */
export function etiquetaDia(fecha: string, now = Date.now()) {
  const hoy = fechaBA(now);
  if (fecha === hoy) return content.today;
  if (fecha === sumarDias(hoy, 1)) return content.tomorrow;
  return capitalizar(formatDay(mediodia(fecha)));
}

/** Agrupa pedidos (ya ordenados) por día de retiro o entrega. */
export function agruparPorDia(lista: PedidoPanel[], now = Date.now()) {
  const dias: { fecha: string; etiqueta: string; pedidos: PedidoPanel[] }[] = [];
  for (const pedido of lista) {
    const ultimo = dias.at(-1);
    if (ultimo?.fecha === pedido.fecha) ultimo.pedidos.push(pedido);
    else dias.push({ fecha: pedido.fecha, etiqueta: etiquetaDia(pedido.fecha, now), pedidos: [pedido] });
  }
  return dias;
}

/** "jueves, 5 de noviembre, 10 a 13 h". */
export function cuando(pedido: Pick<PedidoPanel, "fecha" | "franja">) {
  return `${formatDay(mediodia(pedido.fecha))}, ${pages.checkout.when.slotLabel(pedido.franja)}`;
}

/** Retiro, o envío con la dirección. */
export function entregaDe(pedido: Pick<PedidoPanel, "entrega" | "direccion" | "localidad">) {
  if (pedido.entrega === "retiro") return content.pickup;
  return content.shipping([pedido.direccion, pedido.localidad].filter(Boolean).join(", "));
}

/** "Transferencia · esperando, vence 05/11 17:35 h", "Efectivo · a cobrar al retirar"… */
export function estadoDelPago(pedido: PedidoPanel, now = Date.now()) {
  const medio = content.payment[pedido.medioPago];
  const s = content.paymentStatus;
  const devolucionMp = pedido.pagos.filter((p) => p.estado === "approved");
  let estado: string;
  if (pedido.devolucionPendiente || devolucionMp.some((p) => p.devolucionPendiente)) estado = s.refundPending;
  else if (pedido.devueltoAt || (devolucionMp.length > 0 && devolucionMp.every((p) => p.devueltoAt))) estado = s.refunded;
  else if (pedido.medioPago === "efectivo") estado = pedido.pagadoAt ? s.collected : s.toCollect;
  else if (pedido.pagadoAt || devolucionMp.length > 0) estado = s.paid;
  else if (pedido.medioPago === "transferencia" && pedido.estado === "pendiente_pago") {
    estado = vencido(pedido, now) || !pedido.venceAt ? s.expired : s.waiting(formatShortDateTime(pedido.venceAt));
  } else estado = s.unpaid;
  return `${medio} · ${estado}`;
}

export type Evento = { cuando: string; texto: string };

/** Lo que pasó con el pedido, en orden. */
export function historial(pedido: PedidoPanel, usuariaId: string): Evento[] {
  const h = content.history;
  const eventos: (Evento | null)[] = [
    { cuando: pedido.createdAt, texto: h.created },
    ...pedido.pagos
      .filter((p) => p.estado === "approved")
      .map((p) => ({ cuando: p.createdAt, texto: `${h.paidMp} (${formatPrice(p.monto)})` })),
    pedido.pagadoAt
      ? { cuando: pedido.pagadoAt, texto: h.paidBy(pedido.pagadoPor === usuariaId ? h.you : h.other) }
      : null,
    pedido.aceptadoAt ? { cuando: pedido.aceptadoAt, texto: h.accepted } : null,
    pedido.enPreparacionAt ? { cuando: pedido.enPreparacionAt, texto: h.preparing } : null,
    pedido.listoAt ? { cuando: pedido.listoAt, texto: h.ready } : null,
    pedido.entregadoAt ? { cuando: pedido.entregadoAt, texto: h.delivered } : null,
    pedido.rechazadoAt ? { cuando: pedido.rechazadoAt, texto: h.rejected } : null,
    pedido.canceladoAt ? { cuando: pedido.canceladoAt, texto: h.cancelled } : null,
    pedido.devueltoAt ? { cuando: pedido.devueltoAt, texto: h.refunded } : null,
    ...pedido.pagos.filter((p) => p.devueltoAt).map((p) => ({ cuando: p.devueltoAt!, texto: h.refunded })),
  ];
  return eventos.filter((e): e is Evento => e !== null).sort((a, b) => a.cuando.localeCompare(b.cuando));
}

/**
 * El aviso de WhatsApp a la clienta según el estado (aceptado, listo,
 * rechazado o cancelado), o null si no corresponde. El texto es un borrador
 * de Maggie (data/admin.ts).
 */
export function avisoWhatsApp(pedido: PedidoPanel) {
  const w = content.whatsapp;
  const nombre = pedido.nombre.split(" ")[0];
  const turno = cuando(pedido);
  let mensaje: string | null = null;
  if (pedido.estado === "aceptado") mensaje = w.aceptado(nombre, pedido.numero, turno);
  if (pedido.estado === "listo") {
    mensaje = pedido.entrega === "envio" ? w.listoEnvio(nombre, pedido.numero, turno) : w.listoRetiro(nombre, pedido.numero, turno);
  }
  if (pedido.estado === "rechazado") mensaje = w.rechazado(nombre, pedido.numero, pedido.motivoRechazo ?? "");
  if (pedido.estado === "cancelado" && pedido.motivoCancelacion) {
    mensaje = w.cancelado(nombre, pedido.numero, pedido.motivoCancelacion);
  }
  return mensaje ? waLink(pedido.telefono, mensaje) : null;
}

/** Hay plata para devolver: pagos de MP aprobados sin devolver o un pago registrado a mano. */
export function quedaParaDevolver(pedido: Pick<PedidoPanel, "pagadoAt" | "pagos">) {
  return pedido.pagadoAt !== null || pedido.pagos.some((p) => p.estado === "approved" && !p.devueltoAt);
}

/** La fecha es un día de Buenos Aires: al mediodía, ningún huso la corre. */
const mediodia = (fecha: string) => `${fecha}T12:00:00-03:00`;
const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Las vencidas de una lista (para el contador del Inicio). */
export const vencidas = (lista: PedidoPanel[], now = Date.now()) => lista.filter((p) => vencido(p, now)).length;
