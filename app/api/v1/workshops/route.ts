import { ok, withApi } from "@/lib/api";
import { getWorkshops } from "@/lib/data";

/**
 * GET /api/v1/workshops → 200 { data: Workshop[] }: los próximos (activos y
 * sin empezar), con los lugares libres. Los de ejemplo vienen con isExample.
 */
export const GET = withApi("Error al leer los workshops", async () => ok(await getWorkshops()));
