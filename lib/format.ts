const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

// Con centavos (un monto calculado puede tenerlos): siempre dos decimales.
const centsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

const dayFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Argentina/Buenos_Aires",
});

const dayNumberFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

const monthFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  timeZone: "America/Argentina/Buenos_Aires",
});

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Argentina/Buenos_Aires",
});

/** Ej.: "$ 30.000" o, si tiene centavos, "$ 16.666,67". */
export function formatPrice(value: number) {
  return Number.isInteger(value) ? priceFormatter.format(value) : centsFormatter.format(value);
}

/** Ej.: "sábado, 17 de octubre, 10:00". */
export function formatDate(isoDate: string) {
  return dateFormatter.format(new Date(isoDate));
}

/** Ej.: "sábado, 17 de octubre". */
export function formatDay(isoDate: string) {
  return dayFormatter.format(new Date(isoDate));
}

/** Ej.: "07". */
export function formatDayNumber(isoDate: string) {
  return dayNumberFormatter.format(new Date(isoDate));
}

/** Ej.: "Octubre". */
export function formatMonth(isoDate: string) {
  const month = monthFormatter.format(new Date(isoDate));
  return month.charAt(0).toUpperCase() + month.slice(1);
}

/** Ej.: "10:00 h". */
export function formatTime(isoDate: string) {
  return `${timeFormatter.format(new Date(isoDate))} h`;
}
