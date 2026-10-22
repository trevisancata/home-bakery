import "server-only";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import { ForbiddenError, UnauthorizedError } from "@/lib/admin/errors";
import { createAuthClient } from "@/lib/supabase/server-auth";

// Capa de acceso a la sesión (DAL). El proxy hace un primer control
// optimista; esto se vuelve a verificar en cada layout, página, route handler
// y Server Action del panel (defensa en profundidad). RLS es la última capa.

export type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type AdminSession =
  | { status: "anonima" }
  | { status: "sin-permiso"; userId: string; email: string | null }
  | { status: "admin"; userId: string; email: string | null; nombre: string; supabase: AuthClient };

/**
 * Quién hace el pedido. getClaims() valida la firma del JWT (no confía en la
 * cookie sin verificar, como getSession) y es_admin() lee el rol en la base.
 */
export const getAdminSession = cache(async (): Promise<AdminSession> => {
  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return { status: "anonima" };

  const userId = claims.sub;
  const email = typeof claims.email === "string" ? claims.email : null;
  const { data: esAdmin, error: rolError } = await supabase.rpc("es_admin");
  if (rolError) throw Object.assign(new Error("No se pudo leer el rol"), { code: rolError.code });
  if (esAdmin !== true) return { status: "sin-permiso", userId, email };

  // Para el "Hola, <nombre>" del panel: el de perfiles o, si no hay, el email.
  const { data: perfil } = await supabase.from("perfiles").select("nombre").eq("id", userId).maybeSingle();
  const nombre = perfil?.nombre || email?.split("@")[0] || "";
  return { status: "admin", userId, email, nombre, supabase };
});

/** Para la API y las Server Actions: lanza 401 o 403. */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (session.status === "anonima") throw new UnauthorizedError();
  if (session.status === "sin-permiso") throw new ForbiddenError();
  return session;
}

/** Para las páginas de /admin: sin sesión → login; sin rol → 403 (app/forbidden.tsx). */
export async function requireAdminPage(next = "/admin") {
  const session = await getAdminSession();
  if (session.status === "anonima") redirect(`/admin/ingresar?next=${encodeURIComponent(next)}`);
  if (session.status === "sin-permiso") forbidden();
  return session;
}

/** Destino seguro después del login: solo rutas internas del panel. */
export function safeNext(value: unknown) {
  if (typeof value !== "string") return "/admin";
  const interna = value === "/admin" || value.startsWith("/admin/") || value.startsWith("/admin?");
  return interna && !value.includes("\\") ? value : "/admin";
}
