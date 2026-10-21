import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { BadRequestError, fromDbError, NotFoundError } from "@/lib/admin/errors";
import { obtenerProducto, toAdminImage } from "@/lib/admin/productos";
import { revalidarProducto } from "@/lib/admin/revalidar";
import type { ImagenUpdate } from "@/lib/admin/schemas";
import type { AuthClient } from "@/lib/auth";

// Fotos de productos en el bucket "productos" (público para leer; subir y
// borrar, solo la admin por las políticas de storage.objects).

/** El mismo límite que el bucket (5 MB). */
export const maxImageBytes = 5 * 1024 * 1024;

const formats = { webp: "webp", jpeg: "jpg", png: "png" } as const;
type Format = keyof typeof formats;

const imagenSelect = "id, ruta, alt, sabor, ancho, alto, portada, orden";
const notFound = "La foto no existe.";

/**
 * Valida el archivo por su contenido, no por el nombre ni el tipo que manda
 * el navegador (los dos se pueden falsificar): sharp lee el formato real y
 * las medidas.
 */
async function leerImagen(file: File) {
  if (file.size === 0) throw new BadRequestError("Elegí una foto.", { file: "Elegí una foto." });
  if (file.size > maxImageBytes) {
    throw new BadRequestError("La foto pesa más de 5 MB.", { file: "La foto pesa más de 5 MB: achicala y probá de nuevo." });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const invalid = new BadRequestError("El archivo no es una foto webp, jpg o png.", {
    file: "El archivo no es una foto webp, jpg o png.",
  });
  const metadata = await sharp(buffer)
    .metadata()
    .catch(() => {
      throw invalid;
    });
  if (!metadata.format || !(metadata.format in formats) || !metadata.width || !metadata.height) throw invalid;

  // Con orientación EXIF 5 a 8 la foto se muestra girada: ancho y alto se invierten.
  const rotated = (metadata.orientation ?? 1) >= 5;
  return {
    buffer,
    format: metadata.format as Format,
    width: rotated ? metadata.height : metadata.width,
    height: rotated ? metadata.width : metadata.height,
  };
}

/** Sube una foto al producto. La primera queda como portada. */
export async function subirImagen(
  supabase: AuthClient,
  productoId: string,
  file: File,
  meta: { alt: string; flavor?: string | null },
) {
  const producto = await obtenerProducto(supabase, productoId);
  const image = await leerImagen(file);
  const path = `${producto.slug}/${randomUUID()}.${formats[image.format]}`;

  const bucket = supabase.storage.from("productos");
  const { error: uploadError } = await bucket.upload(path, image.buffer, {
    contentType: `image/${image.format}`,
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) throw Object.assign(new Error("No se pudo subir la foto"), { code: uploadError.name });

  const { data, error } = await supabase
    .from("producto_imagenes")
    .insert({
      producto_id: productoId,
      ruta: path,
      alt: meta.alt,
      sabor: meta.flavor ?? null,
      ancho: image.width,
      alto: image.height,
      portada: producto.images.length === 0,
      orden: Math.max(-1, ...producto.images.map((img) => img.order)) + 1,
    })
    .select(imagenSelect)
    .single();
  if (error) {
    // Sin fila, el archivo quedaría huérfano en Storage.
    await bucket.remove([path]);
    throw fromDbError(error);
  }

  revalidarProducto(producto.slug);
  return toAdminImage(data);
}

async function obtenerImagen(supabase: AuthClient, productoId: string, imagenId: string) {
  const { data, error } = await supabase
    .from("producto_imagenes")
    .select(`${imagenSelect}, producto:productos!inner (slug)`)
    .eq("id", imagenId)
    .eq("producto_id", productoId)
    .maybeSingle();
  if (error) throw fromDbError(error, notFound);
  if (!data) throw new NotFoundError(notFound);
  return data as unknown as Parameters<typeof toAdminImage>[0] & { producto: { slug: string } };
}

/** Cambia el alt, el sabor, el orden o la portada de una foto. */
export async function actualizarImagen(supabase: AuthClient, productoId: string, imagenId: string, input: ImagenUpdate) {
  const actual = await obtenerImagen(supabase, productoId, imagenId);

  // Hay un índice único de una portada por producto: primero se desmarca la anterior.
  if (input.cover && !actual.portada) {
    const { error } = await supabase
      .from("producto_imagenes")
      .update({ portada: false })
      .eq("producto_id", productoId)
      .eq("portada", true);
    if (error) throw fromDbError(error);
  }

  const row: Record<string, unknown> = {};
  if (input.alt !== undefined) row.alt = input.alt;
  if (input.flavor !== undefined) row.sabor = input.flavor;
  if (input.order !== undefined) row.orden = input.order;
  if (input.cover) row.portada = true;

  const { data, error } = await supabase
    .from("producto_imagenes")
    .update(row)
    .eq("id", imagenId)
    .select(imagenSelect)
    .single();
  if (error) throw fromDbError(error, notFound);

  revalidarProducto(actual.producto.slug);
  return toAdminImage(data);
}

/** Borra la foto y su archivo. Si era la portada, pasa a serlo la siguiente. */
export async function borrarImagen(supabase: AuthClient, productoId: string, imagenId: string) {
  const actual = await obtenerImagen(supabase, productoId, imagenId);

  const { error } = await supabase.from("producto_imagenes").delete().eq("id", imagenId);
  if (error) throw fromDbError(error, notFound);

  const { error: storageError } = await supabase.storage.from("productos").remove([actual.ruta]);
  if (storageError) console.error(`No se pudo borrar el archivo de la foto (${storageError.name})`);

  if (actual.portada) {
    const { data: siguiente } = await supabase
      .from("producto_imagenes")
      .select("id")
      .eq("producto_id", productoId)
      .order("orden")
      .limit(1)
      .maybeSingle();
    if (siguiente) await supabase.from("producto_imagenes").update({ portada: true }).eq("id", siguiente.id);
  }

  revalidarProducto(actual.producto.slug);
}
