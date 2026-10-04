// Mensaje de WhatsApp para confirmar una inscripción con Maggie.
//
// TODO(E5): quitar cuando las inscripciones se guarden en Supabase. Mientras
// se guarden en memoria pueden perderse (cold starts en Vercel), así que el
// paso de pago le pide a la persona que le mande sus datos a Maggie.

import { site, whatsappLink, workshopDeposit } from "@/data/site";
import type { Workshop } from "@/data/workshops";
import { formatDay, formatPrice, formatTime } from "@/lib/format";
import { depositOf } from "@/lib/sena";
import type { Inscripcion } from "@/lib/validation/inscripcion";

type WorkshopInfo = Pick<Workshop, "name" | "startsAt" | "price">;

export function inscripcionWhatsappMessage(workshop: WorkshopInfo, inscripcion: Inscripcion) {
  const spots = inscripcion.spots === 1 ? "1 lugar" : `${inscripcion.spots} lugares`;
  const amount = workshop.price === null ? "" : ` (${formatPrice(depositOf(workshop.price * inscripcion.spots))})`;
  return [
    `¡Hola, ${site.owner.name}! Me inscribí desde la web al workshop "${workshop.name}" (${formatDay(workshop.startsAt)}, ${formatTime(workshop.startsAt)}) y quiero reservar ${spots}.`,
    `Quiero pagar la seña del ${workshopDeposit.label}${amount} para confirmar la reserva.`,
    "",
    `Nombre: ${inscripcion.name}`,
    `WhatsApp: ${inscripcion.whatsapp}`,
    `Email: ${inscripcion.email}`,
    `Experiencia: ${inscripcion.experience ?? "—"}`,
    `Alergias o restricciones: ${inscripcion.allergies ?? "—"}`,
  ].join("\n");
}

export function inscripcionWhatsappLink(workshop: WorkshopInfo, inscripcion: Inscripcion) {
  return whatsappLink(inscripcionWhatsappMessage(workshop, inscripcion));
}
