// Preferencia de Checkout Pro para la seña de una inscripción. Es puro: lo
// que se cobra (monto_sena) y el vencimiento vienen de la base.

import type { PreferenceRequest } from "mercadopago/dist/clients/preference/commonTypes";

export type DatosPreferencia = {
  inscripcion: { id: string; email: string; cantidad: number; montoSena: number; venceAt: string };
  workshop: { slug: string; nombre: string; senaPorcentaje: number };
  /** URL pública del sitio (lib/site-url.ts). */
  baseUrl: string;
};

/** Lo que aparece en el resumen de la tarjeta (MP lo corta según la marca). */
export const statementDescriptor = "HOMEBAKERY";

export function rutaResultado(slug: string, inscripcionId: string) {
  return `/workshops/${slug}/inscripcion/resultado?inscripcion=${inscripcionId}`;
}

export function armarPreferencia({ inscripcion, workshop, baseUrl }: DatosPreferencia): PreferenceRequest {
  const lugares = inscripcion.cantidad === 1 ? "1 lugar" : `${inscripcion.cantidad} lugares`;
  const resultado = `${baseUrl}${rutaResultado(workshop.slug, inscripcion.id)}`;
  // MP no acepta auto_return ni notification_url con http://localhost: en
  // local y en los e2e solo queda la conciliación de la página de resultado.
  const publica = baseUrl.startsWith("https://");

  return {
    items: [
      {
        id: workshop.slug,
        title: `Seña ${workshop.senaPorcentaje}% · ${workshop.nombre} · ${lugares}`,
        quantity: 1,
        unit_price: inscripcion.montoSena,
        currency_id: "ARS",
      },
    ],
    payer: { email: inscripcion.email },
    external_reference: inscripcion.id,
    metadata: { inscripcion_id: inscripcion.id },
    back_urls: { success: resultado, pending: resultado, failure: resultado },
    ...(publica
      ? {
          auto_return: "approved",
          // source_news=webhooks: solo webhooks (con firma), no el IPN viejo.
          notification_url: `${baseUrl}/api/v1/webhooks/mercadopago?source_news=webhooks`,
        }
      : {}),
    // La preferencia vence junto con la reserva del lugar (30 minutos).
    expires: true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to: inscripcion.venceAt,
    statement_descriptor: statementDescriptor,
    // Efectivo (Rapipago, Pago Fácil) y cajero se acreditan en días: el
    // lugar ya se habría liberado. Solo medios que se acreditan al instante.
    payment_methods: { excluded_payment_types: [{ id: "ticket" }, { id: "atm" }] },
  };
}
