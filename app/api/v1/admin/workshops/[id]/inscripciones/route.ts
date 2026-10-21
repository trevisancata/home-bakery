import { listarInscripciones } from "@/lib/admin/inscripciones";
import { parseId } from "@/lib/admin/schemas";
import { ok, withAdminApi } from "@/lib/api";

/** GET /api/v1/admin/workshops/<id>/inscripciones → 200 { data: AdminInscripcion[] } · 404 */
export const GET = withAdminApi<{ id: string }>("Error al listar las inscripciones", async (_request, { params, supabase }) =>
  ok(await listarInscripciones(supabase, parseId(params.id, "El workshop no existe.")), { cache: false }),
);
