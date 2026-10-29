// Pedidos de prueba de la tienda: se crean por la API pública (como el
// checkout) con email "e2e-pedido-…@example.com" y se borran en el teardown:
// primero sus pagos, después los pedidos (los ítems se van en cascada).

import { randomBytes } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";
import { fechaMinima, franjasDisponibles, sumarDias } from "../../lib/pedidos/reglas";
import { admin } from "./supabase";
import { testEmailDomain, testEmailPrefix } from "./usuarios";

/** Email de un pedido de prueba (lo usa el teardown para encontrarlo). */
export const emailDePedido = () => `${testEmailPrefix}pedido-${randomBytes(4).toString("hex")}${testEmailDomain}`;

/**
 * El primer día y horario que cumple la anticipación, con una hora de margen
 * (para que no venza mientras corre el test).
 */
export function turnoValido(horas = 48) {
  const date = fechaMinima(horas + 1);
  return { date, slot: franjasDisponibles(date, horas + 1)[0] };
}

/** El primer domingo después de la fecha mínima. */
export function domingo(horas = 48) {
  let fecha = fechaMinima(horas + 1);
  while (new Date(`${fecha}T12:00:00Z`).getUTCDay() !== 0) fecha = sumarDias(fecha, 1);
  return fecha;
}

/** Los tamaños de un producto, en orden (con su id, que el carrito manda a la API). */
export async function tamanosDe(productoId: string) {
  const { data, error } = await admin().from("producto_tamanos").select("id, etiqueta, precio").eq("producto_id", productoId).order("orden");
  if (error) throw new Error(`No se pudieron leer los tamaños: ${error.message}`);
  return data as { id: string; etiqueta: string; precio: number | null }[];
}

export type ItemPedido = { productId: string; sizeId: string; flavor?: string; decoration?: string; quantity: number };

/** POST /api/v1/pedidos con datos válidos de prueba; `datos` pisa lo que haga falta. */
export async function pedir(request: APIRequestContext, items: ItemPedido[], datos: Record<string, unknown> = {}, headers?: Record<string, string>) {
  const response = await request.post("/api/v1/pedidos", {
    headers,
    data: {
      name: "Prueba E2E",
      email: emailDePedido(),
      phone: "11 5555-6666",
      delivery: "retiro",
      ...turnoValido(),
      items,
      ...datos,
    },
  });
  return { response, body: await response.json() };
}

export type PedidoDb = {
  id: string;
  numero: number;
  estado: string;
  total: number | string;
  entrega: string;
  direccion: string | null;
  vence_at: string;
  mp_preference_id: string | null;
  mp_init_point: string | null;
};

export async function leerPedido(id: string): Promise<PedidoDb> {
  const { data, error } = await admin()
    .from("pedidos")
    .select("id, numero, estado, total, entrega, direccion, vence_at, mp_preference_id, mp_init_point")
    .eq("id", id)
    .single();
  if (error) throw new Error(`No se pudo leer el pedido: ${error.message}`);
  return data;
}

export async function itemsDe(pedidoId: string) {
  const { data, error } = await admin()
    .from("pedido_items")
    .select("nombre, tamano_etiqueta, sabor, decoracion, cantidad, precio_unitario, subtotal")
    .eq("pedido_id", pedidoId)
    .order("created_at");
  if (error) throw new Error(`No se pudieron leer los ítems: ${error.message}`);
  return data;
}

export async function pagosDePedido(pedidoId: string) {
  const { data, error } = await admin()
    .from("pagos")
    .select("id, mp_payment_id, estado, monto, devolucion_pendiente, motivo_devolucion")
    .eq("pedido_id", pedidoId);
  if (error) throw new Error(`No se pudieron leer los pagos: ${error.message}`);
  return data;
}

/** Hace vencer un pedido pendiente (como si hubieran pasado los 30 minutos). */
export async function vencerPedido(id: string) {
  const { error } = await admin().from("pedidos").update({ vence_at: new Date(Date.now() - 60_000).toISOString() }).eq("id", id);
  if (error) throw new Error(`No se pudo vencer el pedido: ${error.message}`);
}

/** Borra los pedidos "e2e-…@example.com" y sus pagos. */
export async function borrarPedidosDePrueba() {
  const client = admin();
  const { data, error } = await client
    .from("pedidos")
    .select("id")
    .like("email", `${testEmailPrefix}%${testEmailDomain}`);
  if (error) throw new Error(`No se pudieron listar los pedidos de prueba: ${error.message}`);
  if (data.length === 0) return;
  const ids = data.map((row) => row.id);
  const pagos = await client.from("pagos").delete().in("pedido_id", ids);
  if (pagos.error) throw new Error(`No se pudieron borrar los pagos de los pedidos: ${pagos.error.message}`);
  const pedidos = await client.from("pedidos").delete().in("id", ids).like("email", `${testEmailPrefix}%${testEmailDomain}`);
  if (pedidos.error) throw new Error(`No se pudieron borrar los pedidos de prueba: ${pedidos.error.message}`);
}
