// Validación de la firma (x-signature) de los webhooks de Mercado Pago.
//
// El HMAC lo verifica el validador del SDK oficial: arma el manifest
// "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" y lo compara en tiempo
// constante con v1. La antigüedad de ts se controla acá: la documentación de
// MP habla a veces de segundos y a veces de milisegundos, así que se aceptan
// los dos.

import { InvalidWebhookSignatureError, WebhookSignatureValidator } from "mercadopago";

/** Una notificación más vieja (o más adelantada) que esto se rechaza: evita reenvíos de una firma robada. */
export const toleranciaSegundos = 5 * 60;

export type DatosFirma = {
  xSignature: string | null;
  xRequestId: string | null;
  /** El data.id del query string. */
  dataId: string | null;
  secret: string;
  /** Reloj (ms), para los tests. */
  now?: () => number;
};

export type ResultadoFirma = { ok: true } | { ok: false; motivo: string };

export function validarFirma({ xSignature, xRequestId, dataId, secret, now = Date.now }: DatosFirma): ResultadoFirma {
  if (!secret) return { ok: false, motivo: "sin_secret" };
  if (!xSignature) return { ok: false, motivo: "sin_x_signature" };
  if (!xRequestId) return { ok: false, motivo: "sin_x_request_id" };
  if (!dataId) return { ok: false, motivo: "sin_data_id" };

  try {
    WebhookSignatureValidator.validate({ xSignature, xRequestId, dataId, secret });
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) return { ok: false, motivo: error.reason };
    throw error;
  }

  // ts en segundos (lo normal) o en milisegundos.
  const ts = Number(/(?:^|,)\s*ts=(\d+)/.exec(xSignature)?.[1]);
  const tsMs = ts > 1e12 ? ts : ts * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(now() - tsMs) > toleranciaSegundos * 1000) {
    return { ok: false, motivo: "ts_fuera_de_tolerancia" };
  }
  return { ok: true };
}
