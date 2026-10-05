// Temporada de un producto: un rango de meses (1 a 12) que puede cruzar el
// año, como septiembre → febrero. Se evalúa con el mes de Buenos Aires.

export type Season = { from: number; to: number };

const monthFormatter = new Intl.DateTimeFormat("es-AR", { month: "numeric", timeZone: "America/Argentina/Buenos_Aires" });
const monthNameFormatter = new Intl.DateTimeFormat("es-AR", { month: "long", timeZone: "UTC" });

/** Mes actual (1 a 12) en Argentina. */
export function currentMonth(date = new Date()) {
  return Number(monthFormatter.format(date));
}

/** Si el producto se puede pedir en esa fecha. Sin temporada, siempre. */
export function isInSeason(season: Season | null, date = new Date()) {
  if (!season) return true;
  const month = currentMonth(date);
  return season.from <= season.to
    ? month >= season.from && month <= season.to
    : month >= season.from || month <= season.to;
}

function monthName(month: number) {
  return monthNameFormatter.format(new Date(Date.UTC(2026, month - 1, 15)));
}

/** Ej.: { from: 9, to: 2 } → "de septiembre a febrero". */
export function seasonRange(season: Season) {
  return `de ${monthName(season.from)} a ${monthName(season.to)}`;
}
