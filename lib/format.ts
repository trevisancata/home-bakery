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

export function formatPrice(value: number) {
  return priceFormatter.format(value);
}

/** Ej.: "sábado, 17 de octubre, 10:00". */
export function formatDate(isoDate: string) {
  return dateFormatter.format(new Date(isoDate));
}
