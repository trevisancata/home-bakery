import { hasSupabase } from "./supabase";
import { crearUsuariasDePrueba } from "./usuarios";

/** Crea las usuarias de prueba del panel (admin y sin rol) antes de la corrida. */
export default async function globalSetup() {
  if (hasSupabase) await crearUsuariasDePrueba();
}
