import { borrarWorkshopsDePrueba, hasSupabase } from "./supabase";

/** Al final de la corrida no puede quedar ningún workshop "e2e-…". */
export default async function teardown() {
  if (hasSupabase) await borrarWorkshopsDePrueba();
}
