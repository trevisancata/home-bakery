// Fecha y hora de Buenos Aires ↔ ISO. Argentina usa UTC−3 todo el año (no
// tiene horario de verano desde 2009), así que el desfase es fijo.

const offset = "-03:00";
const offsetMs = 3 * 60 * 60 * 1000;

/** "2026-11-14" + "15:30" (hora de Buenos Aires) → "2026-11-14T15:30:00-03:00". null si falta o no es válida. */
export function isoDesdeBA(fecha: string, hora: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) return null;
  const iso = `${fecha}T${hora}:00${offset}`;
  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
}

/** ISO (cualquier zona) → { fecha: "2026-11-14", hora: "15:30" } en hora de Buenos Aires. */
export function baDesdeIso(iso: string): { fecha: string; hora: string } {
  const local = new Date(new Date(iso).getTime() - offsetMs).toISOString();
  return { fecha: local.slice(0, 10), hora: local.slice(11, 16) };
}
