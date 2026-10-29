import "server-only";
import { after } from "next/server";
import { revalidarWorkshops } from "@/lib/admin/revalidar";
import { buscarPagos, obtenerPago, type PagoMP } from "@/lib/mercadopago";
import { estadoPago } from "@/lib/pagos/estados";
import { leerReferencia, referenciaInscripcion, referenciaPedido } from "@/lib/pagos/referencia";
import { createAdminClient } from "@/lib/supabase/admin";

// Conciliación: trae un pago real de Mercado Pago y lo registra con
// confirmar_pago (migraciones 0003 y 0007). La usan el webhook y las páginas
// de resultado, así el pago se registra aunque el webhook no llegue
// (previews protegidos de Vercel) o llegue tarde. confirmar_pago es
// idempotente: que los dos procesen el mismo pago no cambia nada.
//
// El external_reference dice de qué es el pago: "inscripcion:<id>",
// "pedido:<id>" o, en las inscripciones viejas, el id solo
// (lib/pagos/referencia.ts).

export type Conciliacion =
  | { resultado: "registrado"; tipo: "inscripcion" | "pedido"; estado: string; cambio: boolean }
  /** El pago no existe en MP, no es nuestro o tiene un estado desconocido. */
  | { resultado: "ignorado"; motivo: string };

async function registrar(pago: PagoMP): Promise<Conciliacion> {
  const referencia = leerReferencia(pago.externalReference);
  if (!referencia) return { resultado: "ignorado", motivo: "sin_external_reference" };
  const estado = estadoPago(pago.status);
  if (!estado) {
    console.error(`Estado de pago desconocido de Mercado Pago (${pago.status ?? "sin estado"})`);
    return { resultado: "ignorado", motivo: "estado_desconocido" };
  }
  if (pago.amount === null || !pago.currency) return { resultado: "ignorado", motivo: "sin_monto" };

  const { data, error } = await createAdminClient()
    .rpc("confirmar_pago", {
      p_tipo: referencia.tipo,
      p_id: referencia.id,
      p_mp_payment_id: pago.id,
      p_estado: estado,
      p_monto: pago.amount,
      p_moneda: pago.currency,
      // Solo datos del pago, nunca del pagador.
      p_detalle: {
        status: pago.status,
        status_detail: pago.statusDetail,
        payment_method_id: pago.paymentMethod,
        date_approved: pago.dateApproved,
      },
    })
    .single<{ estado: string; cambio: boolean }>();

  // HB404: la inscripción o el pedido ya no existe (por ejemplo, datos de prueba borrados).
  if (error?.code === "HB404") return { resultado: "ignorado", motivo: `${referencia.tipo}_inexistente` };
  // HB400: el pago ya está registrado para otra inscripción o pedido. No se toca nada.
  if (error?.code === "HB400") return { resultado: "ignorado", motivo: "pago_de_otro" };
  if (error) throw Object.assign(new Error("No se pudo registrar el pago"), { code: error.code });

  // Si una inscripción pasó a reservada (o se canceló), cambiaron los lugares
  // libres. Con after(): la página de resultado concilia mientras se
  // renderiza, y revalidatePath no se puede llamar durante un render. Los
  // pedidos no cambian nada público.
  if (data.cambio && referencia.tipo === "inscripcion") after(revalidarWorkshops);
  return { resultado: "registrado", tipo: referencia.tipo, estado: data.estado, cambio: data.cambio };
}

/** Webhook: el aviso solo trae el id; el estado, el monto y la referencia salen de la API de MP. */
export async function conciliarPago(paymentId: string): Promise<Conciliacion> {
  const pago = await obtenerPago(paymentId);
  if (!pago) return { resultado: "ignorado", motivo: "pago_inexistente" };
  return registrar(pago);
}

/** Registra los pagos en orden (buscarPagos los trae del más nuevo al más viejo: se dan vuelta). */
async function registrarTodos(pagos: PagoMP[]) {
  const resultados: Conciliacion[] = [];
  for (const pago of pagos) resultados.push(await registrar(pago));
  return resultados;
}

/**
 * Página de resultado de una inscripción: busca en MP sus pagos y los
 * registra. Las creadas antes de la 0007 tienen el id solo como referencia.
 */
export async function conciliarInscripcion(inscripcionId: string) {
  const [nuevos, viejos] = await Promise.all([buscarPagos(referenciaInscripcion(inscripcionId)), buscarPagos(inscripcionId)]);
  return registrarTodos([...viejos.reverse(), ...nuevos.reverse()]);
}

/** Página de resultado de un pedido. */
export async function conciliarPedido(pedidoId: string) {
  return registrarTodos((await buscarPagos(referenciaPedido(pedidoId))).reverse());
}
