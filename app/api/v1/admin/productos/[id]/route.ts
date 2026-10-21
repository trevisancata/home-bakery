import { actualizarProducto, borrarProducto, obtenerProducto } from "@/lib/admin/productos";
import { parseId, productoUpdateSchema } from "@/lib/admin/schemas";
import { noContent, ok, readJson, withAdminApi } from "@/lib/api";

type Params = { id: string };
const notFound = "El producto no existe.";

/** GET /api/v1/admin/productos/<id> → 200 · 404 */
export const GET = withAdminApi<Params>("Error al leer el producto (admin)", async (_request, { params, supabase }) =>
  ok(await obtenerProducto(supabase, parseId(params.id, notFound)), { cache: false }),
);

/** PATCH /api/v1/admin/productos/<id> → 200 · 400 · 404. `sizes` reemplaza todos los tamaños. */
export const PATCH = withAdminApi<Params>("Error al editar el producto", async (request, { params, supabase }) => {
  const id = parseId(params.id, notFound);
  const input = productoUpdateSchema.parse(await readJson(request));
  return ok(await actualizarProducto(supabase, id, input), { cache: false });
});

/** DELETE /api/v1/admin/productos/<id> → 204 · 404. Borra también sus fotos. */
export const DELETE = withAdminApi<Params>("Error al borrar el producto", async (_request, { params, supabase }) => {
  await borrarProducto(supabase, parseId(params.id, notFound));
  return noContent();
});
