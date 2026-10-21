import { ok, withApi } from "@/lib/api";
import { getCategories } from "@/lib/data";

/** GET /api/v1/categorias → 200 { data: Categoria[] } */
export const GET = withApi("Error al leer las categorías", async () => ok(await getCategories()));
