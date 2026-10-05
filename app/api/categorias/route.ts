import { ok, serverError } from "@/lib/api";
import { getCategories } from "@/lib/data";

/** GET /api/categorias → 200 { data: Categoria[] } */
export async function GET() {
  try {
    return ok(await getCategories());
  } catch (error) {
    return serverError("Error al leer las categorías", error);
  }
}
