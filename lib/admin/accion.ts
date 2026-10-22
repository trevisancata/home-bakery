import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableError,
} from "@/lib/admin/errors";
import { zodFields } from "@/lib/api";
import { type AuthClient, requireAdmin } from "@/lib/auth";

// Envoltorio de las Server Actions del panel: lo mismo que withApi para la
// API. Verifica sesión y rol en cada acción (el proxy no cubre las Server
// Actions por sí solo), y traduce los errores a un resultado que el
// formulario puede mostrar, sin stack traces ni datos de la base.

export type Resultado<T = null> =
  | { ok: true; data: T; message?: string }
  | { ok: false; message: string; fields?: Record<string, string> };

export async function accion<T>(contexto: string, fn: (supabase: AuthClient) => Promise<T>): Promise<Resultado<T>> {
  try {
    const session = await requireAdmin();
    return { ok: true, data: await fn(session.supabase) };
  } catch (error) {
    // redirect() y notFound() funcionan lanzando: se dejan pasar.
    unstable_rethrow(error);
    if (error instanceof z.ZodError) {
      return { ok: false, message: "Revisá los campos marcados.", fields: zodFields(error) };
    }
    if (error instanceof BadRequestError) return { ok: false, message: error.message, fields: error.fields };
    if (error instanceof UnauthorizedError) return { ok: false, message: "Tu sesión venció. Volvé a ingresar." };
    if (error instanceof ForbiddenError) return { ok: false, message: "No tenés permiso para hacer esto." };
    if (
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof UnprocessableError
    ) {
      return { ok: false, message: error.message };
    }
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "sin código";
    console.error(`${contexto} (${code})`);
    return { ok: false, message: "No se pudo guardar. Probá de nuevo en un rato." };
  }
}
