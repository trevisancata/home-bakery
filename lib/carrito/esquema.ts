// Lo que guarda el carrito en el navegador (localStorage). Se valida con zod
// al leer: si alguien lo editó a mano, quedó de una versión vieja o está
// roto, se descarta. Los precios de acá son solo para mostrar: el que se
// cobra lo calcula la base (crear_pedido).
//
// Usa zod/mini (la variante de zod 4 para el navegador: mismas reglas, una
// fracción del peso), porque se carga en todas las páginas del sitio. El
// provider lo trae con import() después de hidratar. Lo que hace falta sin
// validar está en lib/carrito/lineas.ts.

import * as z from "zod/mini";
import { pedidos } from "@/data/site";

const texto = () => z.string().check(z.minLength(1));

export const lineaSchema = z.object({
  productId: z.uuid(),
  slug: texto(),
  sizeId: z.uuid(),
  name: texto(),
  sizeLabel: texto(),
  flavor: z.nullable(z.string()),
  decoration: z.nullable(z.string()),
  quantity: z.int().check(z.gte(1), z.lte(pedidos.maxCantidad)),
  unitPrice: z.number().check(z.gte(0)),
  leadTimeHours: z.int().check(z.gte(0)),
  image: z.nullable(z.object({ src: z.string(), alt: z.string() })),
});

// La versión es la de lib/carrito/lineas.ts (versionCarrito).
export const carritoSchema = z.object({
  version: z.literal(1),
  lines: z.array(lineaSchema).check(z.maxLength(pedidos.maxLineas)),
});

export type Linea = z.infer<typeof lineaSchema>;

/** El carrito guardado, o vacío si no está, no es JSON o no pasa el esquema. */
export function leerCarrito(raw: string | null): Linea[] {
  if (!raw) return [];
  try {
    const parsed = carritoSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.lines : [];
  } catch {
    return [];
  }
}
