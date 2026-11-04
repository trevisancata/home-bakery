// Cuándo se muestra el tamaño de un producto. Un producto con un solo tamaño
// (hoy siempre "Único") no tiene nada que elegir: mostrar "Único" en el
// detalle, el carrito, Mercado Pago o el panel es ruido.

/** Un solo tamaño con precio: no hay selector, el tamaño se elige solo. */
export function tamanoUnico(sizes: readonly { price: number | null }[]) {
  return sizes.length === 1 && sizes[0].price !== null;
}

/** "Único", sin mayúsculas, tildes ni espacios de más. */
const esUnico = (etiqueta: string) =>
  etiqueta
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") === "unico";

/**
 * Si hay que mostrar la etiqueta del tamaño. Manda la cantidad de tamaños
 * del producto (más de uno: se muestra). Si no se sabe (un pedido ya hecho,
 * un carrito guardado antes de este cambio, un producto borrado), se decide
 * por la etiqueta: "Único" no se muestra.
 */
export function mostrarTamano(etiqueta: string | null | undefined, cantidadDeTamanos?: number | null) {
  if (!etiqueta?.trim()) return false;
  if (cantidadDeTamanos != null) return cantidadDeTamanos > 1;
  return !esUnico(etiqueta);
}

/** La etiqueta, o null si no se muestra (para armar "Grande · Limón" con filter(Boolean)). */
export const etiquetaVisible = (etiqueta: string | null | undefined, cantidadDeTamanos?: number | null) =>
  mostrarTamano(etiqueta, cantidadDeTamanos) ? etiqueta!.trim() : null;
