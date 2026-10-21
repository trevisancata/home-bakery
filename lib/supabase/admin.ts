import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./env.ts";

/**
 * Cliente con la secret key (rol service_role): se saltea RLS. Lo usan:
 * - los scripts (seed);
 * - los pagos (E6), solo del lado del servidor: confirmar_pago (que solo
 *   puede ejecutar service_role), leer el estado de una inscripción en la
 *   página de resultado y guardar la preferencia de MP.
 * Nunca en un componente de cliente, y nunca para lo que puede hacer la
 * clave publishable o la sesión de la admin.
 *
 * Los scripts corren con `node --conditions=react-server` para que el
 * import de server-only no falle fuera de Next.
 */
export function createAdminClient() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
