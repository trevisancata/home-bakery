// Pedidos de prueba de la tienda: se crean por la API pública (como el
// checkout) con email "e2e-pedido-…@example.com" y se borran en el teardown:
// primero sus pagos, después los pedidos (los ítems se van en cascada).

import { randomBytes } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  diaDeSemana,
  fechaBA,
  fechaMinima,
  franjasDelDia,
  franjasDisponibles,
  inicioFranja,
  sumarDias,
} from "../../lib/pedidos/reglas";
import { admin } from "./supabase";
import { avisarPago, cargarPago, nuevoPagoId } from "./pagos";
import { testEmailDomain, testEmailPrefix, testUser } from "./usuarios";

/** Email de un pedido de prueba (lo usa el teardown para encontrarlo). */
export const emailDePedido = () => `${testEmailPrefix}pedido-${randomBytes(4).toString("hex")}${testEmailDomain}`;

// Fechas de prueba: todas se arman a partir de `now` (por defecto, el
// momento de la corrida), así el resultado no depende del día ni de la hora
// en que se corren los tests. Los unitarios (pedidos-unit.spec.ts) fijan
// `now` en sábado a la noche, domingo y lunes temprano.

const horaMs = 60 * 60 * 1000;

/**
 * El primer día y horario que cumple la anticipación, con una hora de margen
 * (para que no venza mientras corre el test).
 */
export function turnoValido(horas = 48, now = Date.now()) {
  const date = fechaMinima(horas + 1, now);
  return { date, slot: franjasDisponibles(date, horas + 1, now)[0] };
}

/** El primer domingo después de la fecha mínima: siempre a más de `horas`. */
export function domingo(horas = 48, now = Date.now()) {
  let fecha = fechaMinima(horas + 1, now);
  while (diaDeSemana(fecha) !== 0) fecha = sumarDias(fecha, 1);
  return fecha;
}

/** Un día hábil a más de `horas`, con una franja que no existe. */
export function fueraDeHorario(horas = 48, now = Date.now()) {
  return { date: turnoValido(horas, now).date, slot: "19-22" };
}

/**
 * La primera franja que empieza en el futuro (con una hora de margen, para
 * que no pase mientras corre el test) pero a menos de `horas`. Pasa la
 * validación del calendario y la rechaza solo la anticipación del producto.
 * Recorre las franjas en orden; si en la ventana no hay ninguna, falla.
 */
export function turnoAntesDe(horas = 48, now = Date.now()) {
  const desde = now + horaMs;
  const hasta = now + horas * horaMs;
  const ultimoDia = fechaBA(hasta);
  for (let fecha = fechaBA(now); fecha <= ultimoDia; fecha = sumarDias(fecha, 1)) {
    for (const slot of franjasDelDia(fecha)) {
      const inicio = inicioFranja(fecha, slot);
      if (inicio >= desde && inicio < hasta) return { date: fecha, slot };
    }
  }
  throw new Error(`No hay ninguna franja entre 1 h y ${horas} h desde ${new Date(now).toISOString()}.`);
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
      payment: "mercadopago",
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
  medio_pago: string;
  vence_at: string | null;
  created_at: string;
  pagado_at: string | null;
  pagado_por: string | null;
  devolucion_pendiente: boolean;
  devuelto_at: string | null;
  mp_preference_id: string | null;
  mp_init_point: string | null;
};

export async function leerPedido(id: string): Promise<PedidoDb> {
  const { data, error } = await admin()
    .from("pedidos")
    .select(
      "id, numero, estado, total, entrega, direccion, medio_pago, vence_at, created_at, pagado_at, pagado_por, devolucion_pendiente, devuelto_at, mp_preference_id, mp_init_point",
    )
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

/** Hace vencer un pedido pendiente (como si hubieran pasado los 30 minutos o las 24 h). */
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

/** Cliente con la clave publishable, como cualquier visitante. */
export const clientePublico = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });

const sesiones = new Map<string, Promise<ReturnType<typeof clientePublico>>>();

/**
 * Cliente con la sesión de una usuaria de prueba (para las funciones de la
 * admin). Una sesión por usuaria y por worker: Supabase Auth limita los
 * logins seguidos (over_request_rate_limit) y la suite hace cientos de llamadas.
 */
export function sesionDe(kind: "admin" | "sinRol") {
  let sesion = sesiones.get(kind);
  if (!sesion) {
    sesion = (async () => {
      const client = clientePublico();
      const { error } = await client.auth.signInWithPassword(testUser(kind));
      if (error) throw new Error(`No se pudo ingresar con la usuaria de prueba (${error.code})`);
      return client;
    })();
    // Si falla, el próximo intento vuelve a probar.
    sesion.catch(() => sesiones.delete(kind));
    sesiones.set(kind, sesion);
  }
  return sesion;
}

/** Hasta dónde llevar un pedido de prueba, como lo haría el sitio y la admin. */
export type Etapa = "pendiente" | "pagado" | "aceptado" | "en_preparacion" | "listo" | "entregado";

/**
 * Un pedido de prueba en una etapa: lo crea por la API y lo avanza con el
 * webhook del mock (Mercado Pago) o con las funciones de la admin.
 */
export async function pedidoEn(
  request: APIRequestContext,
  items: ItemPedido[],
  { medio = "mercadopago", etapa = "pendiente", datos = {} }: { medio?: "mercadopago" | "transferencia" | "efectivo"; etapa?: Etapa; datos?: Record<string, unknown> } = {},
) {
  const { response, body } = await pedir(request, items, { payment: medio, ...datos });
  if (response.status() !== 201) throw new Error(`No se pudo crear el pedido (${response.status()}): ${JSON.stringify(body)}`);
  const id = body.data.id as string;
  const numero = body.data.numero as number;
  const orden: Etapa[] = ["pendiente", "pagado", "aceptado", "en_preparacion", "listo", "entregado"];
  const hasta = orden.indexOf(etapa);
  const client = hasta > 0 ? await sesionDe("admin") : null;
  const ok = async (p: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await p;
    if (error) throw new Error(error.message);
  };
  let pagoId: string | null = null;

  if (hasta >= 1 && client) {
    if (medio === "mercadopago") {
      pagoId = nuevoPagoId();
      const { total } = await leerPedido(id);
      await cargarPago(request, pagoId, { status: "approved", external_reference: `pedido:${id}`, transaction_amount: Number(total) });
      await avisarPago(request, pagoId);
      if ((await leerPedido(id)).estado !== "pagado") throw new Error("El webhook no dejó el pedido pagado");
    } else if (medio === "transferencia") {
      await ok(client.rpc("marcar_pedido_pagado", { p_id: id }));
    }
    // Efectivo: "pagado" es "por confirmar" sin cobrar (se acepta sin pago).
  }
  if (hasta >= 2 && client) await ok(client.rpc("aceptar_pedido", { p_id: id }));
  for (const estado of ["en_preparacion", "listo", "entregado"] as const) {
    if (hasta >= orden.indexOf(estado) && client) {
      await ok(client.rpc("avanzar_pedido", { p_id: id, p_estado: estado, p_cobrado: estado === "entregado" }));
    }
  }
  return { id, numero, pagoId };
}
