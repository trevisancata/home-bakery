import { borrarProductosDePrueba } from "./productos";
import { borrarWorkshopsDePrueba, hasSupabase } from "./supabase";
import { borrarUsuariasDePrueba } from "./usuarios";

/**
 * Al final de la corrida no puede quedar nada de prueba: workshops,
 * productos y fotos "e2e-…" ni usuarias "e2e-…@example.com".
 */
export default async function teardown() {
  if (!hasSupabase) return;
  await borrarWorkshopsDePrueba();
  await borrarProductosDePrueba();
  await borrarUsuariasDePrueba();
}
