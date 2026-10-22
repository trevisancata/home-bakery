// Precios como los escribe Maggie: "12500", "12.500", "$ 12.500,50".
// Formato argentino: punto de miles y coma decimal.

/** null si está vacío ("Precio a confirmar"); NaN si no se entiende. */
export function parsePrecio(texto: string): number | null {
  const limpio = texto.replace(/\$|\s/g, "");
  if (limpio === "") return null;
  let normal: string;
  if (limpio.includes(",")) {
    // Con coma: la coma es el decimal y los puntos, miles.
    normal = limpio.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) {
    // "12.500" o "1.250.000": puntos de miles.
    normal = limpio.replace(/\./g, "");
  } else {
    normal = limpio;
  }
  return /^\d+(\.\d{1,2})?$/.test(normal) ? Number(normal) : Number.NaN;
}

/** 12500 → "12.500"; 12500.5 → "12.500,50"; null → "". Para mostrar en un input. */
export function precioParaInput(valor: number | null) {
  if (valor === null) return "";
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(valor);
}
