import { cambiarEstadoInscripcion } from "@/lib/admin/inscripciones";
import { inscripcionUpdateSchema, parseId } from "@/lib/admin/schemas";
import { ok, readJson, withAdminApi } from "@/lib/api";

/**
 * PATCH /api/v1/admin/inscripciones/<id> { status } → 200 · 400 · 404 ·
 * 409 { spotsLeft } si una cancelada vuelve a estar activa y ya no hay lugar.
 */
export const PATCH = withAdminApi<{ id: string }>("Error al cambiar el estado de la inscripción", async (request, { params, supabase }) => {
  const id = parseId(params.id, "La inscripción no existe.");
  const { status } = inscripcionUpdateSchema.parse(await readJson(request));
  return ok(await cambiarEstadoInscripcion(supabase, id, status), { cache: false });
});
