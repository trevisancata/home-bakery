// Productos de prueba: los crean la API de admin o crearProductoDePrueba,
// siempre con nombre "E2E …" y slug "e2e-…". Cada test borra los suyos al
// terminar; el teardown borra lo que haya quedado, con sus fotos.
//
// Las categorías no son de prueba: son datos fijos del sitio (salen del
// seed, supabase/seed/catalogo.json) y Maggie no las edita desde el panel.
// Una categoría "e2e-…" activa aparecería en los filtros de la tienda y en
// /api/v1/categorias mientras corren los otros tests.

import type { APIRequestContext } from "@playwright/test";
import { admin, testSlugPrefix } from "./supabase";

/** Id de una categoría fija del sitio (por defecto, Budines). */
export async function categoriaDePrueba(slug = "budines") {
  const { data, error } = await admin().from("categorias").select("id").eq("slug", slug).single();
  if (error) throw new Error(`No se encontró la categoría ${slug}: ${error.message}`);
  return data.id as string;
}

export type TestProducto = { id: string; slug: string; name: string };

const sufijo = () => Math.random().toString(36).slice(2, 7);

/** Nombre de producto de prueba: "E2E <label> <sufijo>", único en cada test. */
export const nombreDePrueba = (label = "Producto") => `E2E ${label} ${sufijo()}`;

type DatosProducto = {
  name?: string;
  /** Slug de una categoría fija (budines, postres…). */
  categoria?: string;
  sizes?: { label: string; price: number | null }[];
  medida?: string | null;
  season?: { from: number; to: number } | null;
  /** A medida: se consulta por WhatsApp en vez de pedirse. */
  custom?: boolean;
  flavors?: string[];
  decorations?: string[];
  /** Horas de anticipación (por defecto, las de la base: 48). */
  leadTimeHours?: number;
  featured?: boolean;
  active?: boolean;
  /**
   * Filas de producto_imagenes sin archivo en Storage: alcanza para la API,
   * que devuelve la URL sin pedirla. No usar en páginas que muestran la foto.
   */
  images?: number;
};

/**
 * Crea un producto de prueba directo en la base (sin pasar por la API de
 * admin, así no choca con el tope de 4 destacados). Sirve para la API
 * pública (dinámica) y para el detalle de un producto (una página nueva se
 * genera al primer pedido). Para el listado de /tienda, que es estático
 * (ISR), usar crearProductoPorApi: la API de admin revalida la tienda.
 */
export async function crearProductoDePrueba({
  name = nombreDePrueba(),
  categoria = "budines",
  sizes = [{ label: "Único", price: 1000 }],
  medida = null,
  season = null,
  custom = false,
  flavors = [],
  decorations = [],
  leadTimeHours,
  featured = false,
  active = true,
  images = 0,
}: DatosProducto = {}): Promise<TestProducto> {
  const client = admin();
  const slug = `${testSlugPrefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await client
    .from("productos")
    .insert({
      slug,
      nombre: name,
      categoria_id: await categoriaDePrueba(categoria),
      medida,
      temporada_desde_mes: season?.from ?? null,
      temporada_hasta_mes: season?.to ?? null,
      a_medida: custom,
      sabores: flavors,
      decoraciones: decorations,
      ...(leadTimeHours === undefined ? {} : { anticipacion_horas: leadTimeHours }),
      destacado: featured,
      activo: active,
    })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo crear el producto de prueba: ${error.message}`);
  try {
    const tamanos = await client
      .from("producto_tamanos")
      .insert(sizes.map((size, orden) => ({ producto_id: data.id, etiqueta: size.label, precio: size.price, orden })));
    if (tamanos.error) throw new Error(`No se pudieron crear los tamaños de prueba: ${tamanos.error.message}`);
    if (images > 0) {
      const filas = Array.from({ length: images }, (_, orden) => ({
        producto_id: data.id,
        ruta: `${slug}/foto-${orden}.webp`,
        alt: `${name}, foto ${orden + 1}`,
        ancho: 800,
        alto: 1000,
        portada: orden === 0,
        orden,
      }));
      const imagenes = await client.from("producto_imagenes").insert(filas);
      if (imagenes.error) throw new Error(`No se pudieron crear las fotos de prueba: ${imagenes.error.message}`);
    }
  } catch (cause) {
    await borrarProductoDePrueba(data.id);
    throw cause;
  }
  return { id: data.id, slug, name };
}

/**
 * Crea un producto de prueba con la API de admin (hace falta un contexto con
 * la sesión de la admin de prueba). La API revalida el inicio y /tienda, así
 * el producto aparece en el listado estático.
 */
export async function crearProductoPorApi(
  api: APIRequestContext,
  { name = nombreDePrueba(), categoria = "budines", sizes = [{ label: "Único", price: 1000 }] }: Pick<DatosProducto, "name" | "categoria" | "sizes"> = {},
): Promise<TestProducto> {
  const response = await api.post("/api/v1/admin/productos", {
    data: { name, categoryId: await categoriaDePrueba(categoria), active: true, sizes },
  });
  if (response.status() !== 201) throw new Error(`No se pudo crear el producto de prueba (${response.status()}): ${await response.text()}`);
  const { data } = await response.json();
  return { id: data.id, slug: data.slug, name: data.name };
}

/** Borra un producto de prueba con la API de admin, que vuelve a revalidar /tienda. */
export async function borrarProductoPorApi(api: APIRequestContext, id: string) {
  const response = await api.delete(`/api/v1/admin/productos/${id}`);
  if (response.status() !== 204 && response.status() !== 404) {
    throw new Error(`No se pudo borrar el producto de prueba (${response.status()}): ${await response.text()}`);
  }
}

/** Borra un producto de prueba (los tamaños se van en cascada). Solo "e2e-…". */
export async function borrarProductoDePrueba(id: string) {
  const { error } = await admin().from("productos").delete().eq("id", id).like("slug", `${testSlugPrefix}%`);
  if (error) throw new Error(`No se pudo borrar el producto de prueba: ${error.message}`);
}

/** Borra los productos "e2e-…" (tamaños e imágenes en cascada) y sus archivos en Storage. */
export async function borrarProductosDePrueba() {
  const client = admin();
  const { data, error } = await client.from("productos").select("id").like("slug", `${testSlugPrefix}%`);
  if (error) throw new Error(`No se pudieron listar los productos de prueba: ${error.message}`);
  if (data.length > 0) {
    const borrado = await client.from("productos").delete().in("id", data.map((row) => row.id)).like("slug", `${testSlugPrefix}%`);
    if (borrado.error) throw new Error(`No se pudieron borrar los productos de prueba: ${borrado.error.message}`);
  }

  // Archivos: las carpetas del bucket son los slugs ("e2e-…/<uuid>.png").
  const bucket = client.storage.from("productos");
  const { data: carpetas, error: listError } = await bucket.list("", { search: testSlugPrefix, limit: 1000 });
  if (listError) throw new Error(`No se pudieron listar las fotos de prueba: ${listError.message}`);
  for (const carpeta of carpetas.filter((item) => item.name.startsWith(testSlugPrefix))) {
    const { data: archivos } = await bucket.list(carpeta.name, { limit: 1000 });
    const rutas = (archivos ?? []).map((archivo) => `${carpeta.name}/${archivo.name}`);
    if (rutas.length > 0) await bucket.remove(rutas);
  }
}

/** Cuántos archivos quedan en Storage bajo carpetas "e2e-…". */
export async function fotosDePrueba() {
  const bucket = admin().storage.from("productos");
  const { data } = await bucket.list("", { search: testSlugPrefix, limit: 1000 });
  let total = 0;
  for (const carpeta of (data ?? []).filter((item) => item.name.startsWith(testSlugPrefix))) {
    const { data: archivos } = await bucket.list(carpeta.name, { limit: 1000 });
    total += archivos?.length ?? 0;
  }
  return total;
}
