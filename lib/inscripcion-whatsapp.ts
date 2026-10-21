// Mensaje de WhatsApp para pedir ayuda con el pago de la seña. El pago va
// por Mercado Pago; esto es solo para quien tenga problemas.

import { site, whatsappLink } from "@/data/site";
import type { Workshop } from "@/lib/data";
import { formatDay, formatTime } from "@/lib/format";

type WorkshopInfo = Pick<Workshop, "name" | "startsAt">;

export function ayudaPagoMessage(workshop: WorkshopInfo, nombre?: string) {
  const quien = nombre ? `Soy ${nombre}. ` : "";
  return `¡Hola, ${site.owner.name}! ${quien}Me inscribí al workshop "${workshop.name}" (${formatDay(workshop.startsAt)}, ${formatTime(workshop.startsAt)}) y tengo un problema con el pago de la seña.`;
}

export function ayudaPagoLink(workshop: WorkshopInfo, nombre?: string) {
  return whatsappLink(ayudaPagoMessage(workshop, nombre));
}
