// Productos de prueba del panel: los crea la API de admin con nombre
// "E2E …" (slug "e2e-…") y se borran al terminar, con sus fotos.

import { admin, testSlugPrefix } from "./supabase";

/** Id de una categoría activa para los productos de prueba. */
export async function categoriaDePrueba() {
  const { data, error } = await admin().from("categorias").select("id").eq("slug", "budines").single();
  if (error) throw new Error(`No se encontró la categoría de prueba: ${error.message}`);
  return data.id as string;
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
