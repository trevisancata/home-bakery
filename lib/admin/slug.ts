import type { AuthClient } from "@/lib/auth";

/** "Torta de Limón y Coco" → "torta-de-limon-y-coco". */
export function slugify(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "sin-nombre";
}

/**
 * Slug libre a partir del nombre: si "torta-de-limon" ya existe, prueba
 * "torta-de-limon-2", "-3"… El índice único de la tabla es la garantía
 * final: si dos altas chocan igual, la base responde 23505 (el servicio
 * reintenta una vez).
 */
export async function uniqueSlug(supabase: AuthClient, table: "productos" | "workshops", name: string) {
  const base = slugify(name);
  // base solo tiene [a-z0-9-]: es seguro dentro del filtro de PostgREST.
  const { data, error } = await supabase.from(table).select("slug").or(`slug.eq.${base},slug.like.${base}-%`);
  if (error) throw Object.assign(new Error("No se pudo generar el slug"), { code: error.code });

  const taken = new Set((data as { slug: string }[]).map((row) => row.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
