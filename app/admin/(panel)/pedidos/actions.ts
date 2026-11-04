"use server";

import { revalidatePath } from "next/cache";
import { accion } from "@/lib/admin/accion";
import {
  aceptarPedido,
  avanzarPedido,
  cancelarPedido,
  leerPedido,
  marcarPedidoDevuelto,
  marcarPedidoPagado,
  rechazarPedido,
} from "@/lib/admin/pedidos";
import { quedaParaDevolver } from "@/lib/admin/pedidos-panel";
import { avancePedidoSchema, motivoPedidoSchema, parseId } from "@/lib/admin/schemas";

// Acciones del detalle de un pedido. accion() verifica la sesión de admin; las
// funciones de la base vuelven a chequear es_admin() y validan las transiciones.

/** Después de cada cambio: la lista, el detalle, el Inicio y "Para devolver". */
function revalidar(id: string) {
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/inscripciones");
}

const idDe = (id: string) => parseId(id, "El pedido no existe.");

export async function aceptar(id: string) {
  return accion("Error al aceptar el pedido", async (supabase) => {
    await aceptarPedido(supabase, idDe(id));
    revalidar(id);
    return null;
  });
}

/** Rechazar o cancelar: con motivo. Devuelve si quedó plata para devolver, para avisarlo. */
async function anular(id: string, reason: string, tipo: "rechazar" | "cancelar") {
  return accion(`Error al ${tipo} el pedido`, async (supabase) => {
    const pedidoId = idDe(id);
    const { reason: motivo } = motivoPedidoSchema.parse({ reason });
    if (tipo === "rechazar") await rechazarPedido(supabase, pedidoId, motivo);
    else await cancelarPedido(supabase, pedidoId, motivo);
    revalidar(id);
    const leido = await leerPedido(supabase, pedidoId);
    return { quedaDevolucion: leido ? quedaParaDevolver(leido.pedido) : false };
  });
}

export async function rechazar(id: string, reason: string) {
  return anular(id, reason, "rechazar");
}

export async function cancelar(id: string, reason: string) {
  return anular(id, reason, "cancelar");
}

export async function marcarPagado(id: string) {
  return accion("Error al registrar el pago del pedido", async (supabase) => {
    await marcarPedidoPagado(supabase, idDe(id));
    revalidar(id);
    return null;
  });
}

export async function avanzar(id: string, status: string, collected = false) {
  return accion("Error al avanzar el pedido", async (supabase) => {
    const datos = avancePedidoSchema.parse({ status, collected });
    await avanzarPedido(supabase, idDe(id), datos.status, datos.collected);
    revalidar(id);
    return { status: datos.status };
  });
}

export async function marcarDevuelto(id: string) {
  return accion("Error al marcar la devolución del pedido", async (supabase) => {
    await marcarPedidoDevuelto(supabase, idDe(id));
    revalidar(id);
    return { devueltoAt: new Date().toISOString() };
  });
}
