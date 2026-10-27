// Productos de prueba: los crean la API de admin (tests del panel) o
// crearProductoDePrueba, siempre con nombre "E2E …" y slug "e2e-…". Se
// borran al terminar, con sus fotos.

import { admin, testSlugPrefix } from "./supabase";

/** Id de una categoría activa para los productos de prueba. */
export async function categoriaDePrueba() {
  const { data, error } = await admin().from("categorias").select("id").eq("slug", "budines").single();
  if (error) throw new Error(`No se encontró la categoría de prueba: ${error.message}`);
  return data.id as string;
}

export type TestProducto = { id: string; slug: string; name: string };

/**
 * Crea un producto de prueba directo en la base (sin pasar por la API de
 * admin, así no choca con el tope de 4 destacados). Así los tests no
 * dependen de los precios ni de los destacados reales, que Maggie cambia.
 */
export async function crearProductoDePrueba({
  name = `E2E Producto ${Math.random().toString(36).slice(2, 7)}`,
  sizes = [{ label: "Único", price: 1000 }],
  medida = null,
  season = null,
  featured = false,
  active = true,
}: {
  name?: string;
  sizes?: { label: string; price: number | null }[];
  medida?: string | null;
  season?: { from: number; to: number } | null;
  featured?: boolean;
  active?: boolean;
} = {}): Promise<TestProducto> {
  const client = admin();
  const slug = `${testSlugPrefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await client
    .from("productos")
    .insert({
      slug,
      nombre: name,
      categoria_id: await categoriaDePrueba(),
      medida,
      temporada_desde_mes: season?.from ?? null,
      temporada_hasta_mes: season?.to ?? null,
      destacado: featured,
      activo: active,
    })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo crear el producto de prueba: ${error.message}`);
  const tamanos = await client
    .from("producto_tamanos")
    .insert(sizes.map((size, orden) => ({ producto_id: data.id, etiqueta: size.label, precio: size.price, orden })));
  if (tamanos.error) {
    await borrarProductoDePrueba(data.id);
    throw new Error(`No se pudieron crear los tamaños de prueba: ${tamanos.error.message}`);
  }
  return { id: data.id, slug, name };
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
