// Errores con significado HTTP. Los lanza la capa de servicio (lib/admin) y
// los traduce a respuestas un único lugar: withApi (lib/api.ts) en la API y
// cada Server Action en el panel.

/** 401: no hay sesión (AuthN). */
export class UnauthorizedError extends Error {
  constructor(message = "Tenés que ingresar para seguir.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** 403: hay sesión, pero sin permiso (AuthZ). */
export class ForbiddenError extends Error {
  constructor(message = "No tenés permiso para hacer esto.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** 404: el recurso no existe (o RLS no lo deja ver). */
export class NotFoundError extends Error {
  constructor(message = "No existe.") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** 409: choca con el estado actual (slug repetido, tiene inscripciones, sin cupo…). */
export class ConflictError extends Error {
  constructor(
    message: string,
    readonly spotsLeft?: number,
  ) {
    super(message);
    this.name = "ConflictError";
  }
}

/** 400 que no sale de zod (por ejemplo, un archivo que no es una imagen). */
export class BadRequestError extends Error {
  constructor(
    message: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = "BadRequestError";
  }
}

/** 422: el pedido es válido, pero no se puede cumplir (por ejemplo, un workshop sin precio). */
export class UnprocessableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnprocessableError";
  }
}

/** 429: demasiados pedidos. */
export class TooManyRequestsError extends Error {
  constructor(
    message: string,
    readonly retryAfterSeconds: number,
  ) {
    super(message);
    this.name = "TooManyRequestsError";
  }
}

/** 502: falló un servicio externo (Mercado Pago). */
export class BadGatewayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadGatewayError";
  }
}

/** Error de PostgREST / Postgres tal como lo devuelve supabase-js. */
export type DbError = { code?: string; message: string; details?: string | null };

/**
 * Traduce un error de la base a uno con significado HTTP. Lo que no se
 * reconoce se devuelve tal cual y termina en 500 (con solo el código en el
 * log: el `details` de un check puede traer datos personales).
 */
export function fromDbError(error: DbError, notFound = "No existe."): Error {
  const code = error.code ?? "";
  if (code === "PGRST116" || code === "HB404") return new NotFoundError(notFound);
  if (code === "42501") return new ForbiddenError();
  if (code === "23505") return new ConflictError("Ya existe uno con ese nombre.");
  if (code === "23503") return new ConflictError("Está en uso: no se puede borrar.");
  if (code === "HB409") {
    const spotsLeft = Number(error.details) || 0;
    return new ConflictError(
      spotsLeft === 0
        ? "Ya no quedan lugares en este workshop."
        : `No quedan lugares suficientes: ${spotsLeft === 1 ? "queda 1" : `quedan ${spotsLeft}`}.`,
      spotsLeft,
    );
  }
  if (code === "HB422") return new UnprocessableError("Precio a confirmar, consultanos por WhatsApp.");
  if (code === "23514" || code === "23502" || code.startsWith("22")) {
    return new BadRequestError("Revisá los datos: alguno no es válido.");
  }
  return Object.assign(new Error("Error de la base de datos"), { code });
}
