import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./env.ts";

/**
 * Cliente de Supabase para leer datos públicos desde el servidor, con la
 * clave publishable: respeta RLS (solo lo activo).
 *
 * No usa cookies a propósito: leerlas vuelve dinámica la página y anula el
 * ISR. Cuando haya sesiones (E5, login de la admin) se suma el cliente con
 * cookies de @supabase/ssr para las rutas que lo necesiten.
 */
export function createPublicClient() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
