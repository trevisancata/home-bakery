// Preferencias de Checkout Pro para el pago de una inscripción o de un
// pedido de la tienda (el total). Son puras: lo que se cobra y el
// vencimiento vienen de la base.

import type { PreferenceRequest } from "mercadopago/dist/clients/preference/commonTypes";
import { referenciaInscripcion, referenciaPedido } from "@/lib/pagos/referencia";

export type DatosPreferencia = {
  inscripcion: { id: string; email: string; cantidad: number; montoSena: number; venceAt: string };
  workshop: { slug: string; nombre: string };
  /** URL pública del sitio (lib/site-url.ts). */
  baseUrl: string;
};

/** Lo que aparece en el resumen de la tarjeta (MP lo corta según la marca). */
export const statementDescriptor = "HOMEBAKERY";

export function rutaResultado(slug: string, inscripcionId: string) {
  return `/workshops/${slug}/inscripcion/resultado?inscripcion=${inscripcionId}`;
}

/** Lo que tienen en común las dos preferencias. */
function comun(resultado: string, venceAt: string, publica: boolean) {
  return {
    back_urls: { success: resultado, pending: resultado, failure: resultado },
    ...(publica ? { auto_return: "approved" } : {}),
    expires: true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to: venceAt,
    statement_descriptor: statementDescriptor,
    payment_methods: { excluded_payment_types: [{ id: "ticket" }, { id: "atm" }] },
  } satisfies Partial<PreferenceRequest>;
}

export function armarPreferencia({ inscripcion, workshop, baseUrl }: DatosPreferencia): PreferenceRequest {
  const lugares = inscripcion.cantidad === 1 ? "1 lugar" : `${inscripcion.cantidad} lugares`;
  const resultado = `${baseUrl}${rutaResultado(workshop.slug, inscripcion.id)}`;
  // MP no acepta auto_return con http://localhost: en local y en los e2e la
  // vuelta es con el botón del checkout.
  const publica = baseUrl.startsWith("https://");

  return {
    items: [
      {
        id: workshop.slug,
        title: `Inscripción · ${workshop.nombre} · ${lugares}`,
        quantity: 1,
        unit_price: inscripcion.montoSena,
        currency_id: "ARS",
      },
    ],
    payer: { email: inscripcion.email },
    external_reference: referenciaInscripcion(inscripcion.id),
    metadata: { inscripcion_id: inscripcion.id },
    // Sin notification_url a propósito: los avisos que llegan por la URL de la
    // preferencia no validan con la clave del panel (401 SignatureMismatch en
    // producción). El webhook se configura en Tus integraciones → Webhooks,
    // que firma con MP_WEBHOOK_SECRET. Ver docs/pagos.md y docs/errores.md.
    // La preferencia vence junto con la reserva del lugar (30 minutos).
    // Efectivo (Rapipago, Pago Fácil) y cajero se acreditan en días: el
    // lugar ya se habría liberado. Solo medios que se acreditan al instante.
    ...comun(resultado, inscripcion.venceAt, publica),
  };
}

export type DatosPreferenciaPedido = {
  pedido: { id: string; numero: number; email: string; venceAt: string };
  /** Los ítems con el precio que guardó la base (pedido_items). */
  items: { productoId: string | null; nombre: string; tamano: string; sabor: string | null; cantidad: number; precioUnitario: number }[];
  baseUrl: string;
};

export function rutaResultadoPedido(pedidoId: string) {
  return `/pedido/resultado?pedido=${pedidoId}`;
}

/** Un ítem por línea, con el precio de la base. Mismas reglas que la de inscripción. */
export function armarPreferenciaPedido({ pedido, items, baseUrl }: DatosPreferenciaPedido): PreferenceRequest {
  const resultado = `${baseUrl}${rutaResultadoPedido(pedido.id)}`;
  return {
    items: items.map((item, i) => ({
      id: item.productoId ?? `item-${i + 1}`,
      title: [item.nombre, item.tamano, item.sabor].filter(Boolean).join(" · "),
      quantity: item.cantidad,
      unit_price: item.precioUnitario,
      currency_id: "ARS",
    })),
    payer: { email: pedido.email },
    external_reference: referenciaPedido(pedido.id),
    metadata: { pedido_id: pedido.id, pedido_numero: pedido.numero },
    ...comun(resultado, pedido.venceAt, baseUrl.startsWith("https://")),
  };
}
