import "server-only";
import { fromDbError } from "@/lib/admin/errors";
import type { AuthClient } from "@/lib/auth";

export type AdminCategoria = { id: string; slug: string; name: string; active: boolean };

/** Todas las categorías (también las inactivas), en orden. Con la sesión de la admin (RLS). */
export async function listarCategorias(supabase: AuthClient): Promise<AdminCategoria[]> {
  const { data, error } = await supabase.from("categorias").select("id, slug, nombre, activo").order("orden");
  if (error) throw fromDbError(error);
  return data.map((row) => ({ id: row.id, slug: row.slug, name: row.nombre, active: row.activo }));
}
