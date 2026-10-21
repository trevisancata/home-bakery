import { parseId, workshopUpdateSchema } from "@/lib/admin/schemas";
import { actualizarWorkshop, borrarWorkshop, obtenerWorkshop } from "@/lib/admin/workshops";
import { noContent, ok, readJson, withAdminApi } from "@/lib/api";

type Params = { id: string };
const notFound = "El workshop no existe.";

/** GET /api/v1/admin/workshops/<id> → 200 · 404 */
export const GET = withAdminApi<Params>("Error al leer el workshop (admin)", async (_request, { params, supabase }) =>
  ok(await obtenerWorkshop(supabase, parseId(params.id, notFound)), { cache: false }),
);

/** PATCH /api/v1/admin/workshops/<id> → 200 · 400 · 404 · 409 (cupo menor que lo ocupado) */
export const PATCH = withAdminApi<Params>("Error al editar el workshop", async (request, { params, supabase }) => {
  const id = parseId(params.id, notFound);
  const input = workshopUpdateSchema.parse(await readJson(request));
  return ok(await actualizarWorkshop(supabase, id, input), { cache: false });
});

/** DELETE /api/v1/admin/workshops/<id> → 204 · 404 · 409 si tiene inscripciones. */
export const DELETE = withAdminApi<Params>("Error al borrar el workshop", async (_request, { params, supabase }) => {
  await borrarWorkshop(supabase, parseId(params.id, notFound));
  return noContent();
});
