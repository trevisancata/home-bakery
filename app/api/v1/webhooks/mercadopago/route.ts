import { fail, serverError } from "@/lib/api";
import { conciliarPago } from "@/lib/pagos/conciliar";
import { validarFirma, webhookSecret } from "@/lib/pagos/firma";

/**
 * POST /api/v1/webhooks/mercadopago: avisos de Mercado Pago.
 *
 * 1. Valida la firma (x-signature) con MP_WEBHOOK_SECRET: si no es de MP, 401.
 * 2. Si no es de un pago (merchant_order, etc.), 200 sin hacer nada.
 * 3. No confía en el body: consulta el pago a la API de MP y lo registra con
 *    confirmar_pago (idempotente). 200 si se procesó o si no es nuestro.
 * 4. Si fallan MP o la base, 500: MP reintenta el aviso más tarde.
 *
 * Ver docs/pagos.md.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  // El id que se firma es el del query string (data.id), no el del body.
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const secret = webhookSecret();
  const firma = validarFirma({ xSignature, xRequestId, dataId, secret });
  if (!firma.ok) {
    // Solo el motivo y el x-request-id (para buscarlo en el historial de MP):
    // nunca la firma (v1) ni el secret.
    console.warn(`Webhook de Mercado Pago con firma inválida (${firma.motivo}) · x-request-id=${xRequestId ?? "sin"}`);
    return fail(401, { message: "Firma inválida." });
  }

  const body: { type?: string; topic?: string } = await request.json().catch(() => ({}));
  const tipo = body.type ?? body.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  if (tipo !== "payment") return Response.json({ ok: true, ignorado: "no_es_un_pago" });

  try {
    const resultado = await conciliarPago(dataId!);
    return Response.json({ ok: true, ...resultado });
  } catch (error) {
    return serverError("Error al procesar el webhook de Mercado Pago", error);
  }
}
