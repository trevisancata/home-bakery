import { ok, serverError } from "@/lib/api";
import { getWorkshops } from "@/lib/data";

/**
 * GET /api/workshops → 200 { data: Workshop[] }: los próximos (activos y sin
 * empezar), con los lugares libres. Los de ejemplo vienen con isExample.
 */
export async function GET() {
  try {
    return ok(await getWorkshops());
  } catch (error) {
    return serverError("Error al leer los workshops", error);
  }
}
