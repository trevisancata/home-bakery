import { NotFoundError } from "@/lib/admin/errors";
import { ok, withApi } from "@/lib/api";
import { getProduct } from "@/lib/data";

/** GET /api/v1/productos/<slug> → 200 { data: Producto } · 404 si no existe o está inactivo. */
export const GET = withApi<{ slug: string }>("Error al leer el producto", async (_request, { params }) => {
  const product = await getProduct(params.slug);
  if (!product) throw new NotFoundError("El producto no existe.");
  return ok(product);
});
