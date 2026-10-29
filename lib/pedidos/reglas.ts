// Reglas de fecha, horario y entrega de los pedidos (data/site.ts →
// pedidos). Puras: las usan el checkout, el esquema zod y los tests. La base
// (crear_pedido, migración 0007) las vuelve a validar con los mismos números.
// Las fechas son "YYYY-MM-DD" de Buenos Aires.

import { type Franja, pedidos } from "@/data/site";
import { baDesdeIso, isoDesdeBA } from "@/lib/fecha-ba";

const diaMs = 24 * 60 * 60 * 1000;

export const fechaValida = (fecha: string) => /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(Date.parse(`${fecha}T12:00:00Z`));

/** 0 = domingo … 6 = sábado. */
export function diaDeSemana(fecha: string) {
  return new Date(`${fecha}T12:00:00Z`).getUTCDay();
}

/** Las franjas que se pueden elegir ese día (domingo: ninguna). */
export function franjasDelDia(fecha: string): readonly Franja[] {
  if (!fechaValida(fecha)) return [];
  const dia = diaDeSemana(fecha);
  if (dia === 0) return [];
  return dia === 6 ? pedidos.franjas.sabado : pedidos.franjas.semana;
}

/** Fecha de Buenos Aires de un instante. */
export function fechaBA(now: number) {
  return baDesdeIso(new Date(now).toISOString()).fecha;
}

/** "2026-11-14" + n días. */
export function sumarDias(fecha: string, dias: number) {
  return new Date(Date.parse(`${fecha}T12:00:00Z`) + dias * diaMs).toISOString().slice(0, 10);
}

/** Cuándo empieza la franja (ms). La anticipación se cuenta hasta acá. */
export function inicioFranja(fecha: string, franja: string) {
  const hora = franja.split("-")[0].padStart(2, "0");
  const iso = isoDesdeBA(fecha, `${hora}:00`);
  return iso ? new Date(iso).getTime() : Number.NaN;
}

export function fechaMaxima(now = Date.now()) {
  return sumarDias(fechaBA(now), pedidos.maxDiasAdelante);
}

/** Franjas del día que ya cumplen la anticipación. */
export function franjasDisponibles(fecha: string, horas: number, now = Date.now()) {
  return franjasDelDia(fecha).filter((franja) => inicioFranja(fecha, franja) >= now + horas * 60 * 60 * 1000);
}

/** El primer día con alguna franja que cumpla la anticipación. */
export function fechaMinima(horas: number, now = Date.now()) {
  let fecha = fechaBA(now);
  const max = fechaMaxima(now);
  while (fecha <= max && franjasDisponibles(fecha, horas, now).length === 0) fecha = sumarDias(fecha, 1);
  return fecha;
}

export type ErrorDeFecha = { field: "date" | "slot"; message: string };

/**
 * El primer problema con el día y el horario elegidos, o null. Los mensajes
 * son los mismos que devuelve crear_pedido.
 */
export function validarFechaFranja(fecha: string, franja: string, horas: number, now = Date.now()): ErrorDeFecha | null {
  if (!fechaValida(fecha)) return { field: "date", message: "Elegí un día." };
  if (diaDeSemana(fecha) === 0) {
    return { field: "date", message: "Los domingos no hay retiros ni entregas. Elegí otro día." };
  }
  if (fecha > fechaMaxima(now)) {
    return { field: "date", message: `Podés encargar con hasta ${pedidos.maxDiasAdelante} días de anticipación.` };
  }
  if (!franja) return { field: "slot", message: "Elegí un horario." };
  if (!(franjasDelDia(fecha) as readonly string[]).includes(franja)) {
    return { field: "slot", message: "Ese horario no está disponible ese día." };
  }
  if (inicioFranja(fecha, franja) < now + horas * 60 * 60 * 1000) {
    return {
      field: "date",
      message: `Necesitamos al menos ${horas} h de anticipación: elegí un día o un horario más adelante.`,
    };
  }
  return null;
}

/** El envío se puede elegir solo desde el mínimo (el radio lo valida Maggie). */
export function puedeEnvio(total: number) {
  return total >= pedidos.entrega.envio.minimo;
}

/** La anticipación del pedido: la mayor de sus productos. */
export function anticipacionDe(lineas: { leadTimeHours: number }[]) {
  return lineas.reduce((max, linea) => Math.max(max, linea.leadTimeHours), 0);
}
