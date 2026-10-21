import { actualizarImagen, borrarImagen } from "@/lib/admin/imagenes";
import { imagenUpdateSchema, parseId } from "@/lib/admin/schemas";
import { noContent, ok, readJson, withAdminApi } from "@/lib/api";

type Params = { id: string; imagenId: string };
const notFound = "La foto no existe.";

/** PATCH /api/v1/admin/productos/<id>/imagenes/<imagenId> { alt?, flavor?, order?, cover? } → 200 · 400 · 404 */
export const PATCH = withAdminApi<Params>("Error al editar la foto", async (request, { params, supabase }) => {
  const input = imagenUpdateSchema.parse(await readJson(request));
  const image = await actualizarImagen(supabase, parseId(params.id, notFound), parseId(params.imagenId, notFound), input);
  return ok(image, { cache: false });
});

/** DELETE /api/v1/admin/productos/<id>/imagenes/<imagenId> → 204 · 404. Borra también el archivo. */
export const DELETE = withAdminApi<Params>("Error al borrar la foto", async (_request, { params, supabase }) => {
  await borrarImagen(supabase, parseId(params.id, notFound), parseId(params.imagenId, notFound));
  return noContent();
});
