import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api";
import { getCategories, getFeaturedProducts, getProducts } from "@/lib/data";

const querySchema = z.object({
  categoria: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: "La categoría tiene que ser un slug (ej.: tortas)." })
    .optional(),
  destacados: z.enum(["true", "false"], { error: 'destacados tiene que ser "true" o "false".' }).optional(),
});

/**
 * GET /api/productos?categoria=<slug>&destacados=true|false
 * 200 { data: Producto[] } · 400 { error: { message, fields } } si los parámetros no son válidos.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({
    categoria: params.get("categoria") ?? undefined,
    destacados: params.get("destacados") ?? undefined,
  });
  if (!parsed.success) {
    const fields = Object.fromEntries(
      Object.entries(z.flattenError(parsed.error).fieldErrors).map(([field, messages]) => [field, messages?.[0] ?? ""]),
    );
    return fail(400, { message: "Los parámetros no son válidos.", fields });
  }

  const { categoria, destacados } = parsed.data;
  try {
    if (categoria && !(await getCategories()).some((category) => category.slug === categoria)) {
      return fail(400, { message: "La categoría no existe.", fields: { categoria: "La categoría no existe." } });
    }
    let products = destacados === "true" ? await getFeaturedProducts() : await getProducts();
    if (categoria) products = products.filter((product) => product.category.slug === categoria);
    if (destacados === "false") products = products.filter((product) => !product.featured);
    return ok(products);
  } catch (error) {
    return serverError("Error al leer los productos", error);
  }
}
