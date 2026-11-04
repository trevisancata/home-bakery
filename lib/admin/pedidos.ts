import "server-only";
import { ConflictError, type DbError, fromDbError } from "@/lib/admin/errors";
import type { PedidoPanel } from "@/lib/admin/pedidos-panel";
import { parseId } from "@/lib/admin/schemas";
import type { AuthClient } from "@/lib/auth";

// Pedidos para el panel. Con el cliente de la sesión: RLS deja leer pedidos,
// ítems y pagos solo a la admin, y las funciones (0007 a 0009) vuelven a
// chequear es_admin().

const columnas =
  "id, numero, nombre, email, telefono, entrega, direccion, localidad, fecha, franja, notas, total, estado, medio_pago, vence_at, created_at, pagado_at, pagado_por, aceptado_at, en_preparacion_at, listo_at, entregado_at, rechazado_at, cancelado_at, motivo_rechazo, motivo_cancelacion, devolucion_pendiente, devuelto_at";
const pagos = "pagos (id, mp_payment_id, estado, monto, devolucion_pendiente, motivo_devolucion, devuelto_at, created_at)";

type Row = {
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
  total: number | string;
  estado: string;
  medio_pago: PedidoPanel["medioPago"];
  vence_at: string | null;
  created_at: string;
  pagado_at: string | null;
  pagado_por: string | null;
  aceptado_at: string | null;
  en_preparacion_at: string | null;
  listo_at: string | null;
  entregado_at: string | null;
  rechazado_at: string | null;
  cancelado_at: string | null;
  motivo_rechazo: string | null;
  motivo_cancelacion: string | null;
  devolucion_pendiente: boolean;
  devuelto_at: string | null;
  pedido_items: { cantidad: number }[];
  pagos: {
    id: string;
    mp_payment_id: string;
    estado: string;
    monto: number | string;
    devolucion_pendiente: boolean;
    motivo_devolucion: string | null;
    devuelto_at: string | null;
    created_at: string;
  }[];
};

export type ItemPedido = {
  id: string;
  nombre: string;
  tamano: string;
  sabor: string | null;
  decoracion: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

function aPedido(row: Row): PedidoPanel {
  return {
    id: row.id,
    numero: Number(row.numero),
    nombre: row.nombre,
    email: row.email,
    telefono: row.telefono,
    entrega: row.entrega,
    direccion: row.direccion,
    localidad: row.localidad,
    fecha: row.fecha,
    franja: row.franja,
    notas: row.notas,
    total: Number(row.total),
    estado: row.estado,
    medioPago: row.medio_pago,
    venceAt: row.vence_at,
    createdAt: row.created_at,
    pagadoAt: row.pagado_at,
    pagadoPor: row.pagado_por,
    aceptadoAt: row.aceptado_at,
    enPreparacionAt: row.en_preparacion_at,
    listoAt: row.listo_at,
    entregadoAt: row.entregado_at,
    rechazadoAt: row.rechazado_at,
    canceladoAt: row.cancelado_at,
    motivoRechazo: row.motivo_rechazo,
    motivoCancelacion: row.motivo_cancelacion,
    devolucionPendiente: row.devolucion_pendiente,
    devueltoAt: row.devuelto_at,
    unidades: row.pedido_items.reduce((total, item) => total + item.cantidad, 0),
    pagos: [...row.pagos]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((pago) => ({
        id: pago.id,
        mpPaymentId: pago.mp_payment_id,
        estado: pago.estado,
        monto: Number(pago.monto),
        devolucionPendiente: pago.devolucion_pendiente,
        motivoDevolucion: pago.motivo_devolucion,
        devueltoAt: pago.devuelto_at,
        createdAt: pago.created_at,
      })),
  };
}

/** Los últimos 300 pedidos (el panel los reparte en pestañas). */
export async function listarPedidos(supabase: AuthClient): Promise<PedidoPanel[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select(`${columnas}, pedido_items (cantidad), ${pagos}`)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw fromDbError(error);
  return (data as unknown as Row[]).map(aPedido);
}

/** Un pedido con sus ítems completos, o null si no existe. */
export async function leerPedido(supabase: AuthClient, id: string) {
  const pedidoId = parseId(id, "El pedido no existe.");
  const { data, error } = await supabase
    .from("pedidos")
    .select(
      `${columnas}, pedido_items (cantidad, id, nombre, tamano_etiqueta, sabor, decoracion, precio_unitario, subtotal, created_at), ${pagos}`,
    )
    .eq("id", pedidoId)
    .maybeSingle();
  if (error) throw fromDbError(error);
  if (!data) return null;
  const row = data as unknown as Row & {
    pedido_items: {
      cantidad: number;
      id: string;
      nombre: string;
      tamano_etiqueta: string;
      sabor: string | null;
      decoracion: string | null;
      precio_unitario: number | string;
      subtotal: number | string;
      created_at: string;
    }[];
  };
  const items: ItemPedido[] = [...row.pedido_items]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((item) => ({
      id: item.id,
      nombre: item.nombre,
      tamano: item.tamano_etiqueta,
      sabor: item.sabor,
      decoracion: item.decoracion,
      cantidad: item.cantidad,
      precioUnitario: Number(item.precio_unitario),
      subtotal: Number(item.subtotal),
    }));
  return { pedido: aPedido(row), items };
}

/**
 * Llama a una función del pedido. HB409 trae en el mensaje por qué no se
 * puede (fromDbError lo traduciría al texto del cupo de los workshops).
 */
async function rpc(supabase: AuthClient, nombre: string, args: Record<string, unknown>) {
  const { error } = await supabase.rpc(nombre, args);
  if (!error) return;
  if ((error as DbError).code === "HB409") throw new ConflictError(error.message);
  throw fromDbError(error, "El pedido no existe.");
}

export const aceptarPedido = (supabase: AuthClient, id: string) => rpc(supabase, "aceptar_pedido", { p_id: id });

export const rechazarPedido = (supabase: AuthClient, id: string, motivo: string) =>
  rpc(supabase, "rechazar_pedido", { p_id: id, p_motivo: motivo });

export const cancelarPedido = (supabase: AuthClient, id: string, motivo: string) =>
  rpc(supabase, "cancelar_pedido", { p_id: id, p_motivo: motivo });

export const marcarPedidoPagado = (supabase: AuthClient, id: string) => rpc(supabase, "marcar_pedido_pagado", { p_id: id });

export const avanzarPedido = (supabase: AuthClient, id: string, estado: string, cobrado: boolean) =>
  rpc(supabase, "avanzar_pedido", { p_id: id, p_estado: estado, p_cobrado: cobrado });

export const marcarPedidoDevuelto = (supabase: AuthClient, id: string) => rpc(supabase, "marcar_pedido_devuelto", { p_id: id });
