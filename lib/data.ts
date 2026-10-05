// Acceso a los datos del sitio, desde Supabase con la clave publishable: RLS
// deja ver solo lo activo. Las páginas leen siempre a través de estas
// funciones. `cache` evita consultar dos veces en el mismo render (por
// ejemplo, generateMetadata y la página).

import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/supabase/storage";
import { isInSeason, type Season } from "@/lib/temporada";

export type ProductCategory = { slug: string; name: string; custom: boolean };
export type ProductImage = { src: string; alt: string; width: number; height: number; flavor: string | null };
/** Precio en pesos; null = "Precio a confirmar". */
export type ProductSize = { label: string; price: number | null };

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  measure: string | null;
  servings: string | null;
  weight: string | null;
  /** Caja, pack… (ej.: "Caja de 12 unidades"). */
  presentation: string | null;
  season: Season | null;
  /** Fuera de temporada no se puede pedir. */
  inSeason: boolean;
  /** A medida: se consulta por WhatsApp. */
  custom: boolean;
  leadTimeHours: number;
  featured: boolean;
  images: ProductImage[];
  sizes: ProductSize[];
  flavors: string[];
  decorations: string[];
};

export type WorkshopImage = { src?: string; alt: string };

export type Workshop = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  /** Fecha y hora de inicio en formato ISO. */
  startsAt: string;
  durationMinutes: number;
  level: string | null;
  price: number | null;
  depositPercent: number;
  capacity: number;
  minimum: number;
  spotsLeft: number;
  featured: boolean;
  /** Fecha de ejemplo: se muestra con aviso y no acepta inscripciones. */
  isExample: boolean;
  images: WorkshopImage[];
};

/* -------------------------------------------------------------------------- */
/* Filas de Supabase                                                          */
/* -------------------------------------------------------------------------- */

type CategoriaRow = { slug: string; nombre: string; a_medida: boolean; orden: number };

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
  destacado: boolean;
  orden: number;
  sabores: string[];
  decoraciones: string[];
  categoria: CategoriaRow;
  producto_tamanos: { etiqueta: string; precio: number | string | null; orden: number }[];
  producto_imagenes: { ruta: string; alt: string; sabor: string | null; ancho: number; alto: number; orden: number }[];
};

type WorkshopRow = {
  id: string;
  slug: string;
  nombre: string;
  resumen: string | null;
  descripcion: string | null;
  nivel: string | null;
  fecha_inicio: string;
  duracion_min: number;
  precio: number | string | null;
  sena_porcentaje: number;
  cupo: number;
  cupo_minimo: number;
  destacado: boolean;
  es_ejemplo: boolean;
  lugares_libres: number;
};

const productoSelect = `
  id, slug, nombre, descripcion, medida, porciones, peso, presentacion,
  temporada_desde_mes, temporada_hasta_mes, a_medida, anticipacion_horas, destacado, orden,
  sabores, decoraciones,
  categoria:categorias!inner (slug, nombre, a_medida, orden),
  producto_tamanos (etiqueta, precio, orden),
  producto_imagenes (ruta, alt, sabor, ancho, alto, orden)
`;

/** numeric llega como número o como texto según el tamaño: se normaliza. */
const toPrice = (value: number | string | null) => (value === null ? null : Number(value));

function failed(what: string, error: { message: string; code?: string }): never {
  throw new Error(`No se pudo leer ${what} de Supabase: ${error.message} (${error.code ?? "sin código"})`);
}

function toCategory(row: CategoriaRow): ProductCategory {
  return { slug: row.slug, name: row.nombre, custom: row.a_medida };
}

function toProduct(row: ProductoRow): Product {
  const season =
    row.temporada_desde_mes !== null && row.temporada_hasta_mes !== null
      ? { from: row.temporada_desde_mes, to: row.temporada_hasta_mes }
      : null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.nombre,
    description: row.descripcion,
    category: toCategory(row.categoria),
    measure: row.medida,
    servings: row.porciones,
    weight: row.peso,
    presentation: row.presentacion,
    season,
    inSeason: isInSeason(season),
    custom: row.a_medida,
    leadTimeHours: row.anticipacion_horas,
    featured: row.destacado,
    images: [...row.producto_imagenes]
      .sort((a, b) => a.orden - b.orden)
      .map((img) => ({
        src: publicUrl("productos", img.ruta),
        alt: img.alt,
        width: img.ancho,
        height: img.alto,
        flavor: img.sabor,
      })),
    sizes: [...row.producto_tamanos]
      .sort((a, b) => a.orden - b.orden)
      .map((size) => ({ label: size.etiqueta, price: toPrice(size.precio) })),
    flavors: row.sabores,
    decorations: row.decoraciones,
  };
}

function toWorkshop(row: WorkshopRow): Workshop {
  return {
    id: row.id,
    slug: row.slug,
    name: row.nombre,
    summary: row.resumen,
    description: row.descripcion,
    startsAt: row.fecha_inicio,
    durationMinutes: row.duracion_min,
    level: row.nivel,
    price: toPrice(row.precio),
    depositPercent: row.sena_porcentaje,
    capacity: row.cupo,
    minimum: row.cupo_minimo,
    spotsLeft: row.lugares_libres,
    featured: row.destacado,
    isExample: row.es_ejemplo,
    // TODO(Maggie): fotos de los workshops (tabla workshop_imagenes).
    images: [],
  };
}

/** Catálogo en orden: por categoría y, adentro, por el orden de Maggie. */
const byCatalogOrder = (a: ProductoRow, b: ProductoRow) =>
  a.categoria.orden - b.categoria.orden || a.orden - b.orden;

/* -------------------------------------------------------------------------- */
/* Catálogo                                                                   */
/* -------------------------------------------------------------------------- */

const getAllProducts = cache(async () => {
  const { data, error } = await createPublicClient().from("productos").select(productoSelect);
  if (error) failed("los productos", error);
  return (data as unknown as ProductoRow[]).sort(byCatalogOrder).map(toProduct);
});

/** Productos activos, en el orden del catálogo. Con `categorySlug`, solo esa categoría. */
export async function getProducts(categorySlug?: string) {
  const products = await getAllProducts();
  return categorySlug ? products.filter((product) => product.category.slug === categorySlug) : products;
}

export async function getFeaturedProducts() {
  return (await getAllProducts()).filter((product) => product.featured);
}

/** Un producto activo, o undefined si no existe o está oculto. */
export const getProduct = cache(async (slug: string) => {
  const { data, error } = await createPublicClient()
    .from("productos")
    .select(productoSelect)
    .eq("slug", slug)
    .maybeSingle();
  if (error) failed(`el producto ${slug}`, error);
  return data ? toProduct(data as unknown as ProductoRow) : undefined;
});

/** Todas las categorías activas, en orden. */
export const getCategories = cache(async () => {
  const { data, error } = await createPublicClient()
    .from("categorias")
    .select("slug, nombre, a_medida, orden")
    .order("orden");
  if (error) failed("las categorías", error);
  return (data as CategoriaRow[]).map(toCategory);
});

/** Categorías activas con al menos un producto activo, en orden. */
export async function getProductCategories() {
  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);
  return categories.filter((category) => products.some((product) => product.category.slug === category.slug));
}

/* -------------------------------------------------------------------------- */
/* Workshops                                                                  */
/* -------------------------------------------------------------------------- */

const workshopSelect =
  "id, slug, nombre, resumen, descripcion, nivel, fecha_inicio, duracion_min, precio, sena_porcentaje, cupo, cupo_minimo, destacado, es_ejemplo, lugares_libres";

/** Workshops activos que todavía no empezaron, del más próximo al más lejano, con los lugares libres. */
export const getWorkshops = cache(async () => {
  const { data, error } = await createPublicClient()
    .from("workshops_publicos")
    .select(workshopSelect)
    .order("fecha_inicio");
  if (error) failed("los workshops", error);
  return (data as WorkshopRow[]).map(toWorkshop);
});

/** Un workshop próximo y activo, o undefined. */
export const getWorkshop = cache(async (slug: string) => {
  const { data, error } = await createPublicClient()
    .from("workshops_publicos")
    .select(workshopSelect)
    .eq("slug", slug)
    .maybeSingle();
  if (error) failed(`el workshop ${slug}`, error);
  return data ? toWorkshop(data as WorkshopRow) : undefined;
});

/** El workshop del mes: el destacado o, si no hay, el próximo. */
export async function getFeaturedWorkshop() {
  const upcoming = await getWorkshops();
  return upcoming.find((workshop) => workshop.featured) ?? upcoming[0];
}

/** Página de inscripción de un workshop. */
export function workshopEnrollHref(slug: string) {
  return `/workshops/${slug}/inscripcion`;
}
