import "server-only";
import { conciliarPedido } from "@/lib/pagos/conciliar";
import type { PedidoVista } from "@/lib/pagos/vista";
import { createAdminClient } from "@/lib/supabase/admin";

// Lectura de un pedido para la página de resultado del pago. Usa la secret
// key porque anon no puede leer pedidos; trae solo lo que la página muestra,
// nunca los datos personales (ni nombre, ni email, ni dirección).

export type ResultadoPedido = PedidoVista & {
  id: string;
  numero: number;
  total: number;
  entrega: "retiro" | "envio";
  fecha: string;
  franja: string;
  initPoint: string | null;
};

type Row = {
  id: string;
  numero: number;
  estado: string;
  total: number | string;
  entrega: "retiro" | "envio";
  fecha: string;
  franja: string;
  vence_at: string;
  mp_init_point: string | null;
  pagos: { estado: string; devolucion_pendiente: boolean; created_at: string }[];
};

async function leer(id: string): Promise<ResultadoPedido | null> {
  const { data, error } = await createAdminClient()
    .from("pedidos")
    .select("id, numero, estado, total, entrega, fecha, franja, vence_at, mp_init_point, pagos (estado, devolucion_pendiente, created_at)")
    .eq("id", id)
    // Next memoiza los fetch GET iguales dentro de un render: sin esto, la
    // segunda lectura (después de conciliar) devolvería la primera.
    .abortSignal(new AbortController().signal)
    .maybeSingle<Row>();
  if (error) throw Object.assign(new Error("No se pudo leer el pedido"), { code: error.code });
  if (!data) return null;
  return {
    id: data.id,
    numero: Number(data.numero),
    estado: data.estado,
    total: Number(data.total),
    entrega: data.entrega,
    fecha: data.fecha,
    franja: data.franja,
    venceAt: data.vence_at,
    initPoint: data.mp_init_point,
    pagos: data.pagos.map((pago) => ({
      estado: pago.estado,
      devolucionPendiente: pago.devolucion_pendiente,
      createdAt: pago.created_at,
    })),
  };
}

/**
 * Estado real del pedido. Si sigue pendiente de pago, primero concilia con
 * Mercado Pago (por si el webhook no llegó o llega tarde) y vuelve a leer.
 */
export async function resultadoPedido(id: string) {
  const pedido = await leer(id);
  if (!pedido || pedido.estado !== "pendiente_pago") return pedido;
  try {
    await conciliarPedido(id);
  } catch (error) {
    // Si MP no responde, se muestra lo que hay: la página se refresca sola.
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "sin código";
    console.error(`No se pudo conciliar el pedido con Mercado Pago (${code})`);
    return pedido;
  }
  return leer(id);
}
