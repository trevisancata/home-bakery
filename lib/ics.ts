// Evento de calendario (.ics, RFC 5545) para un workshop reservado.

export type EventoIcs = {
  /** Identificador estable del evento (el id de la inscripción). */
  uid: string;
  titulo: string;
  /** Inicio en ISO 8601. */
  inicio: string;
  duracionMinutos: number;
  lugar?: string;
  descripcion?: string;
  url?: string;
  /** Para los tests. */
  ahora?: Date;
};

/** 2026-11-14T13:00:00.000Z → 20261114T130000Z */
function fechaIcs(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escapa \ ; , y saltos de línea (RFC 5545, 3.3.11). */
function texto(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function eventoIcs({ uid, titulo, inicio, duracionMinutos, lugar, descripcion, url, ahora = new Date() }: EventoIcs) {
  const start = new Date(inicio);
  const end = new Date(start.getTime() + duracionMinutos * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Home Bakery//Workshops//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@homebakery`,
    `DTSTAMP:${fechaIcs(ahora)}`,
    `DTSTART:${fechaIcs(start)}`,
    `DTEND:${fechaIcs(end)}`,
    `SUMMARY:${texto(titulo)}`,
    ...(lugar ? [`LOCATION:${texto(lugar)}`] : []),
    ...(descripcion ? [`DESCRIPTION:${texto(descripcion)}`] : []),
    ...(url ? [`URL:${url}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}

/** Link de descarga (data: URI), sin pasar por el servidor. */
export function icsHref(ics: string) {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
