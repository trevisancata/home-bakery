import { rm } from "node:fs/promises";
import { borrarPedidosDePrueba } from "./pedidos";
import { borrarProductosDePrueba } from "./productos";
import { borrarWorkshopsDePrueba, hasSupabase } from "./supabase";
import { borrarUsuariasDePrueba } from "./usuarios";

/**
 * Al final de la corrida no puede quedar nada de prueba: workshops,
 * productos y fotos "e2e-…", ni pedidos ni usuarias "e2e-…@example.com".
 */
export default async function teardown() {
  if (!hasSupabase) return;
  await borrarWorkshopsDePrueba();
  // Antes que los productos: es más claro (los ítems quedarían con producto_id null).
  await borrarPedidosDePrueba();
  await borrarProductosDePrueba();
  await borrarUsuariasDePrueba();
  // Las sesiones guardadas (cookies con tokens) ya no sirven: se borran.
  await rm("e2e/.auth", { recursive: true, force: true });
}
