import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { BadRequestError, fromDbError, NotFoundError } from "@/lib/admin/errors";
import { revalidarProducto, revalidarWorkshops } from "@/lib/admin/revalidar";
import type { ImagenUpdate } from "@/lib/admin/schemas";
import type { AuthClient } from "@/lib/auth";
import { publicUrl } from "@/lib/supabase/storage";

// Fotos de productos y de workshops, en los buckets "productos" y
// "workshops" (públicos para leer; subir y borrar, solo la admin por las
// políticas de storage.objects).
//
// Toda foto se guarda como webp de hasta 1600 px de lado: pesa poco, se ve
// bien en la tienda y no depende de cómo la sacó el celular. El navegador ya
// la achica antes de subirla (Vercel corta los pedidos de más de 4,5 MB).

export type Destino = "productos" | "workshops";

/** Lo que se acepta de entrada (antes de convertir). */
export const maxImageBytes = 10 * 1024 * 1024;
/** Lado mayor de la foto guardada. */
export const maxLado = 1600;

const config = {
  productos: { tabla: "producto_imagenes", fk: "producto_id", owner: "productos", select: "id, ruta, alt, sabor, ancho, alto, portada, orden" },
  workshops: { tabla: "workshop_imagenes", fk: "workshop_id", owner: "workshops", select: "id, ruta, alt, ancho, alto, portada, orden" },
} as const;

const notFound = "La foto no existe.";
const formatosEntrada = new Set(["webp", "jpeg", "png"]);

export type AdminImage = {
  id: string;
  /** Ruta dentro del bucket. */
  path: string;
  src: string;
  alt: string;
  flavor: string | null;
  width: number;
  height: number;
  cover: boolean;
  order: number;
};

type ImagenRow = {
  id: string;
  ruta: string;
  alt: string;
  sabor?: string | null;
  ancho: number;
  alto: number;
  portada: boolean;
  orden: number;
};

export function toAdminImage(destino: Destino, row: ImagenRow): AdminImage {
  return {
    id: row.id,
    path: row.ruta,
    src: publicUrl(destino, row.ruta),
    alt: row.alt,
    flavor: row.sabor ?? null,
    width: row.ancho,
    height: row.alto,
    cover: row.portada,
    order: row.orden,
  };
}

function revalidar(destino: Destino, slug: string) {
  if (destino === "productos") revalidarProducto(slug);
  else revalidarWorkshops();
}

/**
 * Valida el archivo por su contenido (no por el nombre ni el tipo que manda
 * el navegador, que se pueden falsificar) y lo pasa a webp de hasta 1600 px,
 * enderezado según el EXIF.
 */
export async function convertirImagen(file: File) {
  if (file.size === 0) throw new BadRequestError("Elegí una foto.", { file: "Elegí una foto." });
  if (file.size > maxImageBytes) {
    throw new BadRequestError("La foto pesa más de 10 MB.", { file: "La foto pesa más de 10 MB: elegí otra." });
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
  if (!metadata.format || !formatosEntrada.has(metadata.format) || !metadata.width || !metadata.height) throw invalid;

  const { data, info } = await sharp(buffer)
    .rotate()
    .resize(maxLado, maxLado, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true })
    .catch(() => {
      throw invalid;
    });
  return { buffer: data, width: info.width, height: info.height };
}

/** Slug y fotos actuales del producto o workshop (404 si no existe). */
async function dueño(supabase: AuthClient, destino: Destino, ownerId: string) {
  const c = config[destino];
  const { data, error } = await supabase.from(c.owner).select("slug").eq("id", ownerId).maybeSingle();
  if (error) throw fromDbError(error);
  if (!data) throw new NotFoundError(destino === "productos" ? "El producto no existe." : "El workshop no existe.");
  const { data: fotos, error: fotosError } = await supabase.from(c.tabla).select("id, orden").eq(c.fk, ownerId);
  if (fotosError) throw fromDbError(fotosError);
  return { slug: data.slug as string, fotos: fotos as { id: string; orden: number }[] };
}

/** Sube una foto (convertida a webp). La primera queda como portada; las demás, al final. */
export async function subirImagen(
  supabase: AuthClient,
  destino: Destino,
  ownerId: string,
  file: File,
  meta: { alt: string; flavor?: string | null },
) {
  const c = config[destino];
  const owner = await dueño(supabase, destino, ownerId);
  const image = await convertirImagen(file);
  const path = `${owner.slug}/${randomUUID()}.webp`;

  const bucket = supabase.storage.from(destino);
  const { error: uploadError } = await bucket.upload(path, image.buffer, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) throw Object.assign(new Error("No se pudo subir la foto"), { code: uploadError.name });

  const { data, error } = await supabase
    .from(c.tabla)
    .insert({
      [c.fk]: ownerId,
      ruta: path,
      alt: meta.alt,
      ...(destino === "productos" ? { sabor: meta.flavor ?? null } : {}),
      ancho: image.width,
      alto: image.height,
      portada: owner.fotos.length === 0,
      orden: Math.max(-1, ...owner.fotos.map((foto) => foto.orden)) + 1,
    })
    .select(c.select)
    .single();
  if (error) {
    // Sin fila, el archivo quedaría huérfano en Storage.
    await bucket.remove([path]);
    throw fromDbError(error);
  }

  revalidar(destino, owner.slug);
  return toAdminImage(destino, data as unknown as ImagenRow);
}

async function obtenerImagen(supabase: AuthClient, destino: Destino, ownerId: string, imagenId: string) {
  const c = config[destino];
  const { data, error } = await supabase
    .from(c.tabla)
    .select(`${c.select}, owner:${c.owner}!inner (slug)`)
    .eq("id", imagenId)
    .eq(c.fk, ownerId)
    .maybeSingle();
  if (error) throw fromDbError(error, notFound);
  if (!data) throw new NotFoundError(notFound);
  return data as unknown as ImagenRow & { owner: { slug: string } };
}

/** Cambia el alt, el sabor, el orden o la portada de una foto. */
export async function actualizarImagen(
  supabase: AuthClient,
  destino: Destino,
  ownerId: string,
  imagenId: string,
  input: ImagenUpdate,
) {
  const c = config[destino];
  const actual = await obtenerImagen(supabase, destino, ownerId, imagenId);

  // Hay un índice único de una portada por dueño: primero se desmarca la anterior.
  if (input.cover && !actual.portada) {
    const { error } = await supabase.from(c.tabla).update({ portada: false }).eq(c.fk, ownerId).eq("portada", true);
    if (error) throw fromDbError(error);
  }

  const row: Record<string, unknown> = {};
  if (input.alt !== undefined) row.alt = input.alt;
  if (input.flavor !== undefined && destino === "productos") row.sabor = input.flavor;
  if (input.order !== undefined) row.orden = input.order;
  if (input.cover) row.portada = true;

  const { data, error } = await supabase.from(c.tabla).update(row).eq("id", imagenId).select(c.select).single();
  if (error) throw fromDbError(error, notFound);

  revalidar(destino, actual.owner.slug);
  return toAdminImage(destino, data as unknown as ImagenRow);
}

/** Deja las fotos en el orden de `ids` (0, 1, 2…). Los ids tienen que ser todas las fotos del dueño. */
export async function reordenarImagenes(supabase: AuthClient, destino: Destino, ownerId: string, ids: string[]) {
  const c = config[destino];
  const owner = await dueño(supabase, destino, ownerId);
  const actuales = new Set(owner.fotos.map((foto) => foto.id));
  if (ids.length !== actuales.size || !ids.every((id) => actuales.has(id))) {
    throw new BadRequestError("El orden no coincide con las fotos actuales. Recargá la página.");
  }
  for (const [orden, id] of ids.entries()) {
    const { error } = await supabase.from(c.tabla).update({ orden }).eq("id", id).eq(c.fk, ownerId);
    if (error) throw fromDbError(error);
  }
  revalidar(destino, owner.slug);
}

/** Borra la foto y su archivo. Si era la portada, pasa a serlo la siguiente. */
export async function borrarImagen(supabase: AuthClient, destino: Destino, ownerId: string, imagenId: string) {
  const c = config[destino];
  const actual = await obtenerImagen(supabase, destino, ownerId, imagenId);

  const { error } = await supabase.from(c.tabla).delete().eq("id", imagenId);
  if (error) throw fromDbError(error, notFound);

  const { error: storageError } = await supabase.storage.from(destino).remove([actual.ruta]);
  if (storageError) console.error(`No se pudo borrar el archivo de la foto (${storageError.name})`);

  if (actual.portada) {
    const { data: siguiente } = await supabase
      .from(c.tabla)
      .select("id")
      .eq(c.fk, ownerId)
      .order("orden")
      .limit(1)
      .maybeSingle();
    if (siguiente) await supabase.from(c.tabla).update({ portada: true }).eq("id", siguiente.id);
  }

  revalidar(destino, actual.owner.slug);
}
