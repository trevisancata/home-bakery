import { revalidatePath } from "next/cache";

// Revalidación on-demand: después de cada cambio desde el panel, las páginas
// públicas afectadas se regeneran en la próxima visita (en lugar de esperar
// los 5 minutos del ISR).

/** Un producto cambió: el inicio (favoritos), la tienda y su detalle. */
export function revalidarProducto(...slugs: string[]) {
  revalidatePath("/");
  revalidatePath("/tienda");
  for (const slug of slugs) revalidatePath(`/tienda/${slug}`);
}

/**
 * Un workshop o sus lugares libres cambiaron: el inicio (banda del mes) y
 * /workshops. La inscripción es dinámica (lee el cupo en cada request).
 */
export function revalidarWorkshops() {
  revalidatePath("/");
  revalidatePath("/workshops");
}
