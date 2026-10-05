import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./env.ts";

/**
 * Cliente con la secret key (rol service_role): se saltea RLS. Solo para
 * scripts (seed); nunca en páginas ni en route handlers.
 *
 * Los scripts corren con `node --conditions=react-server` para que el
 * import de server-only no falle fuera de Next.
 */
export function createAdminClient() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
