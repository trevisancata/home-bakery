// Respuestas de la API interna: { data } si salió bien, { error } si no.

/** Las respuestas OK se cachean 5 minutos en la CDN, igual que las páginas. */
const cacheOk = "public, s-maxage=300, stale-while-revalidate=600";

export type ApiError = {
  message: string;
  /** Errores por campo (validación). */
  fields?: Record<string, string>;
  /** Lugares libres, cuando no alcanza el cupo. */
  spotsLeft?: number;
};

export function ok<T>(data: T, init: { status?: number; cache?: boolean } = {}) {
  const { status = 200, cache = true } = init;
  return Response.json({ data }, { status, headers: { "Cache-Control": cache ? cacheOk : "no-store" } });
}

export function fail(status: number, error: ApiError) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Error inesperado: se registra solo el código, nunca datos personales. */
export function serverError(context: string, error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "sin código";
  console.error(`${context} (${code})`);
  return fail(500, { message: "Algo salió mal. Probá de nuevo." });
}
