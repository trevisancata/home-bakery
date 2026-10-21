import { z } from "zod";
import { BadRequestError } from "@/lib/admin/errors";
import { ok, withApi } from "@/lib/api";
import { getCategories, getFeaturedProducts, getProducts } from "@/lib/data";

const querySchema = z.object({
  categoria: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: "La categoría tiene que ser un slug (ej.: tortas)." })
    .optional(),
  destacados: z.enum(["true", "false"], { error: 'destacados tiene que ser "true" o "false".' }).optional(),
});

/**
 * GET /api/v1/productos?categoria=<slug>&destacados=true|false
 * 200 { data: Producto[] } · 400 { error: { message, fields } } si los parámetros no son válidos.
 */
export const GET = withApi("Error al leer los productos", async (request) => {
  const params = new URL(request.url).searchParams;
  const { categoria, destacados } = querySchema.parse({
    categoria: params.get("categoria") ?? undefined,
    destacados: params.get("destacados") ?? undefined,
  });

  if (categoria && !(await getCategories()).some((category) => category.slug === categoria)) {
    throw new BadRequestError("La categoría no existe.", { categoria: "La categoría no existe." });
  }
  let products = destacados === "true" ? await getFeaturedProducts() : await getProducts();
  if (categoria) products = products.filter((product) => product.category.slug === categoria);
  if (destacados === "false") products = products.filter((product) => !product.featured);
  return ok(products);
});
