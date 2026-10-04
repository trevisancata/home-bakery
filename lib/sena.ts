import { workshopDeposit } from "@/data/site";

/** Seña para reservar un workshop: el 50% del total, redondeado al peso. */
export function depositOf(total: number) {
  return Math.round(total * workshopDeposit.rate);
}

/** Lo que queda por pagar después de la seña. */
export function balanceOf(total: number) {
  return total - depositOf(total);
}
