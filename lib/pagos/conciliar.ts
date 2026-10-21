import "server-only";
import { after } from "next/server";
import { z } from "zod";
import { revalidarWorkshops } from "@/lib/admin/revalidar";
import { buscarPagos, obtenerPago, type PagoMP } from "@/lib/mercadopago";
import { estadoPago } from "@/lib/pagos/estados";
import { createAdminClient } from "@/lib/supabase/admin";

// Conciliación: trae un pago real de Mercado Pago y lo registra con
// confirmar_pago (migración 0003). La usan el webhook y la página de
// resultado, así el lugar se reserva aunque el webhook no llegue (previews
// protegidos de Vercel) o llegue tarde. confirmar_pago es idempotente: que
// los dos procesen el mismo pago no cambia nada.

export type Conciliacion =
  | { resultado: "registrado"; estadoInscripcion: string; cambio: boolean }
  /** El pago no existe en MP, no es de una inscripción o tiene un estado desconocido. */
  | { resultado: "ignorado"; motivo: string };

const uuid = z.uuid();

async function registrar(pago: PagoMP): Promise<Conciliacion> {
  const inscripcionId = pago.externalReference;
  if (!inscripcionId || !uuid.safeParse(inscripcionId).success) {
    return { resultado: "ignorado", motivo: "sin_external_reference" };
  }
  const estado = estadoPago(pago.status);
  if (!estado) {
    console.error(`Estado de pago desconocido de Mercado Pago (${pago.status ?? "sin estado"})`);
    return { resultado: "ignorado", motivo: "estado_desconocido" };
  }
  if (pago.amount === null || !pago.currency) return { resultado: "ignorado", motivo: "sin_monto" };

  const { data, error } = await createAdminClient()
    .rpc("confirmar_pago", {
      p_inscripcion_id: inscripcionId,
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
    .single<{ estado_inscripcion: string; cambio: boolean }>();

  // HB404: la inscripción ya no existe (por ejemplo, datos de prueba borrados).
  if (error?.code === "HB404") return { resultado: "ignorado", motivo: "inscripcion_inexistente" };
  // HB400: el pago dice ser de otra inscripción. No se toca nada.
  if (error?.code === "HB400") return { resultado: "ignorado", motivo: "pago_de_otra_inscripcion" };
  if (error) throw Object.assign(new Error("No se pudo registrar el pago"), { code: error.code });

  // Si una inscripción pasó a reservada (o se canceló), cambiaron los lugares
  // libres. Con after(): la página de resultado concilia mientras se
  // renderiza, y revalidatePath no se puede llamar durante un render.
  if (data.cambio) after(revalidarWorkshops);
  return { resultado: "registrado", estadoInscripcion: data.estado_inscripcion, cambio: data.cambio };
}

/** Webhook: el aviso solo trae el id; el estado, el monto y la referencia salen de la API de MP. */
export async function conciliarPago(paymentId: string): Promise<Conciliacion> {
  const pago = await obtenerPago(paymentId);
  if (!pago) return { resultado: "ignorado", motivo: "pago_inexistente" };
  return registrar(pago);
}

/** Página de resultado: busca en MP los pagos de la inscripción y los registra (del más viejo al más nuevo). */
export async function conciliarInscripcion(inscripcionId: string) {
  const pagos = await buscarPagos(inscripcionId);
  const resultados: Conciliacion[] = [];
  for (const pago of pagos.reverse()) resultados.push(await registrar(pago));
  return resultados;
}
