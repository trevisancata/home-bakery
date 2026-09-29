const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
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

export function formatPrice(value: number) {
  return priceFormatter.format(value);
}

/** Ej.: "sábado, 17 de octubre, 10:00". */
export function formatDate(isoDate: string) {
  return dateFormatter.format(new Date(isoDate));
}

/** Ej.: "sábado, 17 de octubre". */
export function formatDay(isoDate: string) {
  return dayFormatter.format(new Date(isoDate));
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

/** Ej.: 180 → "3 horas", 150 → "2 horas y media". */
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hoursText = hours === 1 ? "1 hora" : `${hours} horas`;
  if (rest === 0) return hoursText;
  if (rest === 30) return `${hoursText} y media`;
  return `${hoursText} ${rest} min`;
}
