// Datos de prueba en Supabase para los e2e. Usa la secret key (se saltea
// RLS) con un cliente propio: lib/supabase/admin.ts importa server-only, que
// no se puede cargar dentro de Playwright.
//
// Los workshops de prueba se crean con slug "e2e-…", es_ejemplo = false y
// precio (si no, crear_inscripcion responde HB422), y se borran al terminar:
// primero los pagos, después las inscripciones y al final el workshop.

import { test as base } from "@playwright/test";
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

/** Crea un workshop de prueba activo, dentro de 60 días. Seña del 50%. */
export async function crearWorkshopDePrueba({
  cupo = 6,
  precio = 30000,
}: { cupo?: number; precio?: number | null } = {}): Promise<TestWorkshop> {
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
      sena_porcentaje: 50,
      activo: true,
      es_ejemplo: false,
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
 * El próximo workshop de ejemplo (data/workshops.ts) que todavía no empezó.
 * Las fechas de ejemplo van pasando: los tests no fijan uno por slug.
 */
export async function proximoWorkshopDeEjemplo() {
  const { data, error } = await admin()
    .from("workshops")
    .select("slug, nombre")
    .eq("es_ejemplo", true)
    .eq("activo", true)
    .gt("fecha_inicio", new Date().toISOString())
    .order("fecha_inicio")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`No se pudieron leer los workshops de ejemplo: ${error.message}`);
  return data as { slug: string; nombre: string } | null;
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
