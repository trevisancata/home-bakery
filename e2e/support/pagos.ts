// Helpers de los tests de pagos: el mock de Mercado Pago, la firma de los
// webhooks y la lectura directa de la base (con la secret key).

import { createHmac, randomUUID } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";
import { admin } from "./supabase";

const mockUrl = () => process.env.E2E_MP_MOCK_URL ?? "http://127.0.0.1:3101";
const secret = () => {
  const value = process.env.E2E_MP_WEBHOOK_SECRET;
  if (!value) throw new Error("Falta E2E_MP_WEBHOOK_SECRET (lo genera playwright.config.ts).");
  return value;
};

let nextPaymentId = Date.now();
/** Id de pago único (numérico, como los de MP). */
export const nuevoPagoId = () => String(nextPaymentId++);

export type PagoMock = {
  status: string;
  status_detail?: string;
  external_reference: string;
  transaction_amount: number;
  currency_id?: string;
  payment_method_id?: string;
};

/** Carga (o cambia) un pago en el mock de MP. */
export async function cargarPago(request: APIRequestContext, id: string, pago: PagoMock) {
  const response = await request.put(`${mockUrl()}/__mock/payments/${id}`, {
    data: { currency_id: "ARS", payment_method_id: "visa", status_detail: "accredited", ...pago },
  });
  if (!response.ok()) throw new Error(`El mock no aceptó el pago (${response.status()})`);
}

/** La preferencia que creó la web para una inscripción. */
export async function preferenciaDe(request: APIRequestContext, inscripcionId: string) {
  const response = await request.get(`${mockUrl()}/__mock/preferences?external_reference=${inscripcionId}`);
  return response.ok() ? response.json() : null;
}

/** Headers de una notificación firmada como lo hace MP (manifest id;request-id;ts). */
export function firmar(dataId: string, { ts = Math.floor(Date.now() / 1000), clave = secret(), requestId = randomUUID() } = {}) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", clave).update(manifest).digest("hex");
  return { "x-signature": `ts=${ts},v1=${v1}`, "x-request-id": requestId };
}

/** Manda un aviso de pago al webhook, firmado. */
export function avisarPago(
  request: APIRequestContext,
  paymentId: string,
  { type = "payment", headers = firmar(paymentId) as Record<string, string> }: { type?: string; headers?: Record<string, string> } = {},
) {
  return request.post(`/api/v1/webhooks/mercadopago?data.id=${paymentId}&type=${type}`, {
    headers,
    data: { action: "payment.updated", api_version: "v1", type, data: { id: paymentId }, live_mode: false },
  });
}

export type InscripcionDb = {
  id: string;
  estado: string;
  monto_sena: number | string | null;
  vence_at: string;
  mp_preference_id: string | null;
  mp_init_point: string | null;
};

export async function leerInscripcion(id: string): Promise<InscripcionDb> {
  const { data, error } = await admin()
    .from("inscripciones")
    .select("id, estado, monto_sena, vence_at, mp_preference_id, mp_init_point")
    .eq("id", id)
    .single();
  if (error) throw new Error(`No se pudo leer la inscripción: ${error.message}`);
  return data;
}

export async function pagosDe(inscripcionId: string) {
  const { data, error } = await admin()
    .from("pagos")
    .select("mp_payment_id, estado, monto, devolucion_pendiente, motivo_devolucion")
    .eq("inscripcion_id", inscripcionId);
  if (error) throw new Error(`No se pudieron leer los pagos: ${error.message}`);
  return data;
}

/** Hace vencer una inscripción pendiente (como si hubieran pasado los 30 minutos). */
export async function vencer(id: string) {
  const { error } = await admin()
    .from("inscripciones")
    .update({ vence_at: new Date(Date.now() - 60_000).toISOString() })
    .eq("id", id);
  if (error) throw new Error(`No se pudo vencer la inscripción: ${error.message}`);
}
