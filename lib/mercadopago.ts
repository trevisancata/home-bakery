import "server-only";
import { MercadoPagoConfig, MPNotFoundError, Payment, Preference } from "mercadopago";
import type { PreferenceRequest } from "mercadopago/dist/clients/preference/commonTypes";
import { AppConfig } from "mercadopago/dist/utils/config";

// Cliente de Mercado Pago (SDK oficial). Solo en el servidor: el access
// token cobra en nombre de la cuenta y nunca va al navegador ni a los logs.

/**
 * Solo para los e2e: apunta el SDK a un mock local de la API de MP
 * (e2e/support/mp-mock.ts). Solo se acepta localhost, así el token nunca
 * puede salir hacia otro host por una variable mal cargada.
 */
const mockBaseUrl = process.env.MP_API_BASE_URL;
if (mockBaseUrl) {
  if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(mockBaseUrl)) {
    throw new Error("MP_API_BASE_URL solo puede apuntar a un mock en localhost.");
  }
  // El tipo lo marca readonly, pero es una propiedad estática común que el
  // SDK lee en cada pedido.
  (AppConfig as { BASE_URL: string }).BASE_URL = mockBaseUrl;
}

let config: MercadoPagoConfig | null = null;

function mercadoPago() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Falta la variable de entorno MP_ACCESS_TOKEN. Ver .env.example.");
  // El webhook tiene que responder en menos de 22 s: 8 s por pedido y un
  // solo reintento (el SDK reintenta 3 veces por defecto, con esperas de
  // hasta 30 s). Si igual falla, MP vuelve a mandar el aviso.
  config ??= new MercadoPagoConfig({ accessToken, options: { timeout: 8000, maxRetries: 1 } });
  return config;
}

/** Crea la preferencia de Checkout Pro y devuelve su id y el link de pago. */
export async function crearPreferencia(body: PreferenceRequest) {
  const preference = await new Preference(mercadoPago()).create({ body });
  if (!preference.id || !preference.init_point) throw new Error("Mercado Pago no devolvió la preferencia");
  return { id: preference.id, initPoint: preference.init_point };
}

export type PagoMP = {
  id: string;
  status: string | null;
  statusDetail: string | null;
  externalReference: string | null;
  amount: number | null;
  currency: string | null;
  paymentMethod: string | null;
  dateApproved: string | null;
};

type PagoSDK = {
  id?: number | string;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  currency_id?: string;
  payment_method_id?: string;
  date_approved?: string;
};

/** Solo los campos que se usan: los datos del pagador no salen de acá. */
function toPago(payment: PagoSDK): PagoMP {
  return {
    id: String(payment.id),
    status: payment.status ?? null,
    statusDetail: payment.status_detail ?? null,
    externalReference: payment.external_reference ?? null,
    amount: typeof payment.transaction_amount === "number" ? payment.transaction_amount : null,
    currency: payment.currency_id ?? null,
    paymentMethod: payment.payment_method_id ?? null,
    dateApproved: payment.date_approved ?? null,
  };
}

/** Un pago por id, tal como lo tiene MP (nunca el del aviso). null si no existe. */
export async function obtenerPago(id: string): Promise<PagoMP | null> {
  try {
    return toPago(await new Payment(mercadoPago()).get({ id }));
  } catch (error) {
    if (error instanceof MPNotFoundError) return null;
    throw error;
  }
}

/** Los pagos de una inscripción (external_reference = id de la inscripción). */
export async function buscarPagos(externalReference: string): Promise<PagoMP[]> {
  const result = await new Payment(mercadoPago()).search({
    options: { external_reference: externalReference, sort: "date_created", criteria: "desc" },
  });
  return (result.results ?? []).filter((payment) => payment.id !== undefined).map(toPago);
}
