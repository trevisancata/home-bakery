import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authCookieOptions } from "./cookies.ts";
import { requireEnv } from "./env.ts";

/**
 * Cliente de Supabase con la sesión de la usuaria (cookies), con la clave
 * publishable: corre con su rol y RLS decide qué puede hacer. Solo para
 * /admin, la API de admin y las Server Actions.
 *
 * Leer cookies vuelve dinámica la ruta: las páginas públicas usan
 * createPublicClient (lib/supabase/server.ts) para seguir estáticas con ISR.
 */
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Desde un Server Component no se pueden escribir cookies: el proxy ya
        // renovó la sesión en este request, así que se puede ignorar.
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {}
      },
    },
  });
}
