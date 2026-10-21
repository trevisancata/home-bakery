import "server-only";
import { fromDbError, NotFoundError } from "@/lib/admin/errors";
import { revalidarProducto } from "@/lib/admin/revalidar";
import type { ProductoCreate, ProductoUpdate } from "@/lib/admin/schemas";
import { uniqueSlug } from "@/lib/admin/slug";
import type { AuthClient } from "@/lib/auth";
import { publicUrl } from "@/lib/supabase/storage";

// Productos desde el panel. Todas las funciones reciben el cliente con la
// sesión de la admin: RLS es la última barrera (nunca la secret key).

export type AdminProductImage = {
  id: string;
  /** Ruta dentro del bucket "productos". */
  path: string;
  src: string;
  alt: string;
  flavor: string | null;
  width: number;
  height: number;
  cover: boolean;
  order: number;
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: { id: string; slug: string; name: string };
  measure: string | null;
  servings: string | null;
  weight: string | null;
  presentation: string | null;
  season: { from: number; to: number } | null;
  custom: boolean;
  leadTimeHours: number;
  active: boolean;
  featured: boolean;
  order: number;
  flavors: string[];
  decorations: string[];
  sizes: { id: string; label: string; price: number | null }[];
  images: AdminProductImage[];
  createdAt: string;
  updatedAt: string;
};

type ImagenRow = {
  id: string;
  ruta: string;
  alt: string;
  sabor: string | null;
  ancho: number;
  alto: number;
  portada: boolean;
  orden: number;
};

type ProductoRow = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  medida: string | null;
  porciones: string | null;
  peso: string | null;
  presentacion: string | null;
  temporada_desde_mes: number | null;
  temporada_hasta_mes: number | null;
  a_medida: boolean;
  anticipacion_horas: number;
  activo: boolean;
  destacado: boolean;
  orden: number;
  sabores: string[];
  decoraciones: string[];
  created_at: string;
  updated_at: string;
  categoria: { id: string; slug: string; nombre: string; orden: number };
  producto_tamanos: { id: string; etiqueta: string; precio: number | string | null; orden: number }[];
  producto_imagenes: ImagenRow[];
};

const productoSelect = `
  id, slug, nombre, descripcion, medida, porciones, peso, presentacion,
  temporada_desde_mes, temporada_hasta_mes, a_medida, anticipacion_horas,
  activo, destacado, orden, sabores, decoraciones, created_at, updated_at,
  categoria:categorias!inner (id, slug, nombre, orden),
  producto_tamanos (id, etiqueta, precio, orden),
  producto_imagenes (id, ruta, alt, sabor, ancho, alto, portada, orden)
`;

const notFound = "El producto no existe.";

export function toAdminImage(row: ImagenRow): AdminProductImage {
  return {
    id: row.id,
    path: row.ruta,
    src: publicUrl("productos", row.ruta),
    alt: row.alt,
    flavor: row.sabor,
    width: row.ancho,
    height: row.alto,
    cover: row.portada,
    order: row.orden,
  };
}

function toAdminProduct(row: ProductoRow): AdminProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.nombre,
    description: row.descripcion,
    category: { id: row.categoria.id, slug: row.categoria.slug, name: row.categoria.nombre },
    measure: row.medida,
    servings: row.porciones,
    weight: row.peso,
    presentation: row.presentacion,
    season:
      row.temporada_desde_mes !== null && row.temporada_hasta_mes !== null
        ? { from: row.temporada_desde_mes, to: row.temporada_hasta_mes }
        : null,
    custom: row.a_medida,
    leadTimeHours: row.anticipacion_horas,
    active: row.activo,
    featured: row.destacado,
    order: row.orden,
    flavors: row.sabores,
    decorations: row.decoraciones,
    sizes: [...row.producto_tamanos]
      .sort((a, b) => a.orden - b.orden)
      .map((size) => ({ id: size.id, label: size.etiqueta, price: size.precio === null ? null : Number(size.precio) })),
    images: [...row.producto_imagenes].sort((a, b) => a.orden - b.orden).map(toAdminImage),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Campos del esquema → columnas. Lo que no vino no se toca. */
function toRow(input: ProductoUpdate) {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.nombre = input.name;
  if (input.categoryId !== undefined) row.categoria_id = input.categoryId;
  if (input.description !== undefined) row.descripcion = input.description;
  if (input.measure !== undefined) row.medida = input.measure;
  if (input.servings !== undefined) row.porciones = input.servings;
  if (input.weight !== undefined) row.peso = input.weight;
  if (input.presentation !== undefined) row.presentacion = input.presentation;
  if (input.season !== undefined) {
    row.temporada_desde_mes = input.season?.from ?? null;
    row.temporada_hasta_mes = input.season?.to ?? null;
  }
  if (input.custom !== undefined) row.a_medida = input.custom;
  if (input.leadTimeHours !== undefined) row.anticipacion_horas = input.leadTimeHours;
  if (input.active !== undefined) row.activo = input.active;
  if (input.featured !== undefined) row.destacado = input.featured;
  if (input.order !== undefined) row.orden = input.order;
  if (input.flavors !== undefined) row.sabores = input.flavors;
  if (input.decorations !== undefined) row.decoraciones = input.decorations;
  return row;
}

async function reemplazarTamanos(supabase: AuthClient, productoId: string, sizes: NonNullable<ProductoUpdate["sizes"]>) {
  const { error } = await supabase.rpc("reemplazar_tamanos", {
    p_producto_id: productoId,
    p_tamanos: sizes.map((size, index) => ({ etiqueta: size.label, precio: size.price, orden: index })),
  });
  if (error) throw fromDbError(error, notFound);
}

/** Todos los productos, también los inactivos, en el orden del catálogo. */
export async function listarProductos(supabase: AuthClient) {
  const { data, error } = await supabase.from("productos").select(productoSelect);
  if (error) throw fromDbError(error);
  return (data as unknown as ProductoRow[])
    .sort((a, b) => a.categoria.orden - b.categoria.orden || a.orden - b.orden)
    .map(toAdminProduct);
}

export async function obtenerProducto(supabase: AuthClient, id: string) {
  const { data, error } = await supabase.from("productos").select(productoSelect).eq("id", id).maybeSingle();
  if (error) throw fromDbError(error, notFound);
  if (!data) throw new NotFoundError(notFound);
  return toAdminProduct(data as unknown as ProductoRow);
}

export async function crearProducto(supabase: AuthClient, input: ProductoCreate) {
  const { sizes, ...campos } = input;
  const row = toRow(campos);

  // Si otra alta tomó el mismo slug entre la consulta y el insert (23505),
  // se reintenta una vez con un slug nuevo.
  let created: { id: string; slug: string } | null = null;
  for (let attempt = 0; attempt < 2 && !created; attempt++) {
    const slug = await uniqueSlug(supabase, "productos", input.name);
    const { data, error } = await supabase.from("productos").insert({ ...row, slug }).select("id, slug").single();
    if (!error) created = data;
    else if (error.code !== "23505" || attempt === 1) throw fromDbError(error);
  }
  if (!created) throw new Error("No se pudo crear el producto");

  if (sizes?.length) {
    try {
      await reemplazarTamanos(supabase, created.id, sizes);
    } catch (error) {
      // Sin los tamaños el producto quedaría a medias: se deshace el alta.
      await supabase.from("productos").delete().eq("id", created.id);
      throw error;
    }
  }

  revalidarProducto(created.slug);
  return obtenerProducto(supabase, created.id);
}

/** Edición parcial. El slug no cambia aunque cambie el nombre: los links publicados siguen andando. */
export async function actualizarProducto(supabase: AuthClient, id: string, input: ProductoUpdate) {
  const actual = await obtenerProducto(supabase, id);
  const { sizes, ...campos } = input;
  const row = toRow(campos);

  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from("productos").update(row).eq("id", id);
    if (error) throw fromDbError(error, notFound);
  }
  if (sizes) await reemplazarTamanos(supabase, id, sizes);

  revalidarProducto(actual.slug);
  return obtenerProducto(supabase, id);
}

/** Borra el producto (tamaños e imágenes en cascada) y sus fotos de Storage. */
export async function borrarProducto(supabase: AuthClient, id: string) {
  const actual = await obtenerProducto(supabase, id);
  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) throw fromDbError(error, notFound);

  if (actual.images.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("productos")
      .remove(actual.images.map((image) => image.path));
    // El producto ya no existe: un archivo huérfano no es motivo para fallar.
    if (storageError) console.error(`No se pudieron borrar las fotos del producto (${storageError.name})`);
  }

  revalidarProducto(actual.slug);
}
