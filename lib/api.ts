// Respuestas de la API interna: { data } si salió bien, { error } si no.
// withApi centraliza el manejo de errores de todos los route handlers, y
// withAdminApi le suma la verificación de sesión y rol de la API de admin.

import { z } from "zod";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/admin/errors";
import { type AuthClient, requireAdmin } from "@/lib/auth";

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

/** 204 sin cuerpo (DELETE). */
export function noContent() {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

/** El primer error de cada campo; los anidados con punto (sizes.0.label). */
export function zodFields(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".") || "body";
    if (!fields[field]) fields[field] = issue.message;
  }
  return fields;
}

/** Cuerpo JSON del pedido; si no es JSON válido, 400. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new BadRequestError("La solicitud no es válida: el cuerpo tiene que ser JSON.");
  }
}

/**
 * Traduce cualquier error a una respuesta. Lo inesperado es un 500 genérico:
 * al log va solo el contexto y el código, nunca el stack, el `details` de la
 * base (puede traer datos personales) ni nada que mande el cliente.
 */
export function errorResponse(context: string, error: unknown) {
  if (error instanceof z.ZodError) {
    return fail(400, { message: "Revisá los datos: alguno no es válido.", fields: zodFields(error) });
  }
  if (error instanceof BadRequestError) return fail(400, { message: error.message, fields: error.fields });
  if (error instanceof UnauthorizedError) return fail(401, { message: error.message });
  if (error instanceof ForbiddenError) return fail(403, { message: error.message });
  if (error instanceof NotFoundError) return fail(404, { message: error.message });
  if (error instanceof ConflictError) {
    return fail(409, error.spotsLeft === undefined ? { message: error.message } : { message: error.message, spotsLeft: error.spotsLeft });
  }
  return serverError(context, error);
}

/** Error inesperado: se registra solo el código, nunca datos personales. */
export function serverError(context: string, error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "sin código";
  console.error(`${context} (${code})`);
  return fail(500, { message: "Algo salió mal. Probá de nuevo." });
}

type RouteContext<P> = { params: Promise<P> };

/** Route handler con manejo de errores centralizado. */
export function withApi<P = Record<string, never>>(
  context: string,
  handler: (request: Request, ctx: { params: P }) => Promise<Response>,
) {
  return async (request: Request, ctx: RouteContext<P>) => {
    try {
      return await handler(request, { params: await ctx.params });
    } catch (error) {
      return errorResponse(context, error);
    }
  };
}

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Route handler de la API de admin. El proxy ya frenó a quien no tiene
 * sesión; acá se vuelve a verificar la sesión y el rol (401/403), y en los
 * métodos que modifican, que el pedido venga del mismo sitio (Origin): las
 * cookies son SameSite=Lax, esto es una segunda barrera contra CSRF.
 * Nunca se cachea.
 */
export function withAdminApi<P = Record<string, never>>(
  context: string,
  handler: (request: Request, ctx: { params: P; supabase: AuthClient }) => Promise<Response>,
) {
  return withApi<P>(context, async (request, { params }) => {
    const session = await requireAdmin();
    if (!safeMethods.has(request.method) && !sameOrigin(request)) {
      throw new ForbiddenError("El pedido no viene del panel.");
    }
    const response = await handler(request, { params, supabase: session.supabase });
    response.headers.set("Cache-Control", "no-store");
    return response;
  });
}

/** Sin Origin (curl, scripts) se acepta: igual necesitan la cookie de sesión. */
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  } catch {
    return false;
  }
}
