import { fail, ok, serverError } from "@/lib/api";
import { getProduct } from "@/lib/data";

/** GET /api/productos/<slug> → 200 { data: Producto } · 404 si no existe o está inactivo. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    if (!product) return fail(404, { message: "El producto no existe." });
    return ok(product);
  } catch (error) {
    return serverError("Error al leer el producto", error);
  }
}
