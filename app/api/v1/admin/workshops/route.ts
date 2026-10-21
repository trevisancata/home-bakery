import { workshopCreateSchema } from "@/lib/admin/schemas";
import { crearWorkshop, listarWorkshops } from "@/lib/admin/workshops";
import { ok, readJson, withAdminApi } from "@/lib/api";

/** GET /api/v1/admin/workshops → 200 { data: AdminWorkshop[] }, también inactivos y pasados. */
export const GET = withAdminApi("Error al listar los workshops (admin)", async (_request, { supabase }) =>
  ok(await listarWorkshops(supabase), { cache: false }),
);

/** POST /api/v1/admin/workshops → 201 { data: AdminWorkshop } · 400 */
export const POST = withAdminApi("Error al crear el workshop", async (request, { supabase }) => {
  const input = workshopCreateSchema.parse(await readJson(request));
  return ok(await crearWorkshop(supabase, input), { status: 201, cache: false });
});
