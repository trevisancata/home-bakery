// Datos de prueba en Supabase para los e2e. Usa la secret key (se saltea
// RLS) con un cliente propio: lib/supabase/admin.ts importa server-only, que
// no se puede cargar dentro de Playwright.
//
// Los workshops de prueba se crean con slug "e2e-…", es_ejemplo = false y
// precio (si no, crear_inscripcion responde HB422), y se borran al terminar:
// primero los pagos, después las inscripciones y al final el workshop.

import { type APIRequestContext, expect, type Locator, type Page, test as base } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

export const hasSupabase = Boolean(url && secret);
export const skipReason = "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local.";

export const testSlugPrefix = "e2e-";

/** Cliente con la secret key (se saltea RLS). Solo para preparar y limpiar datos. */
export function admin() {
  if (!url || !secret) throw new Error(skipReason);
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type TestWorkshop = { id: string; slug: string; name: string; precio: number | null };

/**
 * Crea un workshop de prueba activo, dentro de 60 días, directo en la base.
 * Pago completo (100%), como los reales desde la 0006. Sirve para la API y
 * la inscripción, que leen la base en cada pedido. Para el listado de
 * /workshops (estático, ISR), usar crearWorkshopPorApi.
 */
export async function crearWorkshopDePrueba({
  cupo = 6,
  precio = 30000,
  esEjemplo = false,
}: { cupo?: number; precio?: number | null; esEjemplo?: boolean } = {}): Promise<TestWorkshop> {
  const slug = `${testSlugPrefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const name = "Workshop de prueba (e2e)";
  const { data, error } = await admin()
    .from("workshops")
    .insert({
      slug,
      nombre: name,
      fecha_inicio: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      cupo,
      cupo_minimo: 1,
      precio,
      sena_porcentaje: 100,
      activo: true,
      es_ejemplo: esEjemplo,
    })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo crear el workshop de prueba: ${error.message}`);
  return { id: data.id, slug, name, precio };
}

/** Borra los workshops de prueba y sus inscripciones. Sin ids, todos los "e2e-…". */
export async function borrarWorkshopsDePrueba(ids?: string[]) {
  const client = admin();
  let targets = ids;
  if (!targets) {
    const { data, error } = await client.from("workshops").select("id").like("slug", `${testSlugPrefix}%`);
    if (error) throw new Error(`No se pudieron listar los workshops de prueba: ${error.message}`);
    targets = data.map((row) => row.id);
  }
  if (targets.length === 0) return;
  const { data: inscriptas, error: listError } = await client.from("inscripciones").select("id").in("workshop_id", targets);
  if (listError) throw new Error(`No se pudieron listar las inscripciones de prueba: ${listError.message}`);
  if (inscriptas.length > 0) {
    const pagos = await client.from("pagos").delete().in("inscripcion_id", inscriptas.map((row) => row.id));
    if (pagos.error) throw new Error(`No se pudieron borrar los pagos de prueba: ${pagos.error.message}`);
  }
  const inscripciones = await client.from("inscripciones").delete().in("workshop_id", targets);
  if (inscripciones.error) throw new Error(`No se pudieron borrar las inscripciones: ${inscripciones.error.message}`);
  const workshops = await client.from("workshops").delete().in("id", targets).like("slug", `${testSlugPrefix}%`);
  if (workshops.error) throw new Error(`No se pudieron borrar los workshops de prueba: ${workshops.error.message}`);
}

/**
 * Crea un workshop de prueba con la API de admin (hace falta un contexto con
 * la sesión de la admin de prueba). La API revalida /workshops, así aparece
 * en el listado estático.
 */
export async function crearWorkshopPorApi(api: APIRequestContext, { isExample = false }: { isExample?: boolean } = {}) {
  const response = await api.post("/api/v1/admin/workshops", {
    data: {
      name: `E2E Workshop ${Math.random().toString(36).slice(2, 7)}`,
      startsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 6,
      minimum: 1,
      active: true,
      isExample,
    },
  });
  if (response.status() !== 201) throw new Error(`No se pudo crear el workshop de prueba (${response.status()}): ${await response.text()}`);
  const { data } = await response.json();
  return { id: data.id as string, slug: data.slug as string, name: data.name as string };
}

/** Borra un workshop de prueba con la API de admin, que vuelve a revalidar /workshops. */
export async function borrarWorkshopPorApi(api: APIRequestContext, id: string) {
  const response = await api.delete(`/api/v1/admin/workshops/${id}`);
  if (response.status() !== 204 && response.status() !== 404) {
    throw new Error(`No se pudo borrar el workshop de prueba (${response.status()}): ${await response.text()}`);
  }
}

/**
 * Abre una página estática (ISR) hasta que se vea lo que creó el test. La
 * API de admin la revalida, pero con otros tests revalidando la misma página
 * en paralelo, una regeneración que empezó antes del alta puede terminar
 * después y dejar por un momento la versión vieja.
 */
export async function abrirHastaVer(page: Page, url: string, locator: (page: Page) => Locator) {
  await expect(async () => {
    await page.goto(url);
    await expect(locator(page)).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

/** Cuántos lugares ocupan las inscripciones de un workshop. */
export async function lugaresOcupados(workshopId: string) {
  const { data, error } = await admin()
    .from("inscripciones")
    .select("cantidad, estado, vence_at")
    .eq("workshop_id", workshopId);
  if (error) throw new Error(error.message);
  // Igual que lugares_ocupados(): reservadas y pendientes que no vencieron.
  return data
    .filter((row) => row.estado === "reservada" || (row.estado === "pendiente_sena" && new Date(row.vence_at) > new Date()))
    .reduce((total, row) => total + row.cantidad, 0);
}

/**
 * Test con un workshop de prueba propio (cupo 6), que se borra al terminar.
 * Cada test tiene el suyo, así pueden correr en paralelo.
 */
export const test = base.extend<{ workshop: TestWorkshop }>({
  workshop: async ({}, provide) => {
    const workshop = await crearWorkshopDePrueba();
    try {
      await provide(workshop);
    } finally {
      await borrarWorkshopsDePrueba([workshop.id]);
    }
  },
});

export { expect } from "@playwright/test";
