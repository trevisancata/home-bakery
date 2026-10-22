import { BadRequestError } from "@/lib/admin/errors";
import { maxImageBytes, subirImagen } from "@/lib/admin/imagenes";
import { imagenCreateSchema, parseId } from "@/lib/admin/schemas";
import { ok, withAdminApi } from "@/lib/api";

type Params = { id: string };

/**
 * POST /api/v1/admin/productos/<id>/imagenes (multipart/form-data)
 * Campos: file (webp, jpg o png, hasta 10 MB; se guarda como webp de hasta 1600 px), alt, flavor (opcional).
 * 201 { data: AdminProductImage } · 400 · 404
 */
export const POST = withAdminApi<Params>("Error al subir la foto", async (request, { params, supabase }) => {
  const productoId = parseId(params.id, "El producto no existe.");

  // Se corta antes de leer el cuerpo si declara más de lo permitido (+ margen del multipart).
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxImageBytes + 64 * 1024) {
    throw new BadRequestError("La foto pesa más de 10 MB.", { file: "La foto pesa más de 10 MB: elegí otra." });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new BadRequestError("La solicitud no es válida: mandá la foto como multipart/form-data.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new BadRequestError("Elegí una foto.", { file: "Elegí una foto." });

  const meta = imagenCreateSchema.parse({
    alt: form.get("alt") ?? undefined,
    flavor: form.get("flavor") ?? undefined,
  });
  return ok(await subirImagen(supabase, "productos", productoId, file, meta), { status: 201, cache: false });
});
