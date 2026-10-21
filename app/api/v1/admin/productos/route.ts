import { crearProducto, listarProductos } from "@/lib/admin/productos";
import { productoCreateSchema } from "@/lib/admin/schemas";
import { ok, readJson, withAdminApi } from "@/lib/api";

/** GET /api/v1/admin/productos → 200 { data: AdminProduct[] }, también los inactivos. */
export const GET = withAdminApi("Error al listar los productos (admin)", async (_request, { supabase }) =>
  ok(await listarProductos(supabase), { cache: false }),
);

/** POST /api/v1/admin/productos → 201 { data: AdminProduct } · 400 · 409 */
export const POST = withAdminApi("Error al crear el producto", async (request, { supabase }) => {
  const input = productoCreateSchema.parse(await readJson(request));
  return ok(await crearProducto(supabase, input), { status: 201, cache: false });
});
