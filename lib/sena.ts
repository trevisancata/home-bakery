// Seña de un workshop. La que se cobra la calcula siempre la base
// (crear_inscripcion, migración 0003); esta es la misma cuenta para
// mostrarla en el formulario antes de enviar. El porcentaje es el de cada
// workshop (sena_porcentaje): 50% por defecto, según la respuesta de Maggie
// del 01/10.

/** Seña = precio × lugares × porcentaje / 100, redondeada al centavo (igual que la base). */
export function montoSena(precio: number, lugares: number, porcentaje: number) {
  // En centavos para no arrastrar errores de punto flotante (0.1 + 0.2).
  const centavos = Math.round((Math.round(precio * 100) * lugares * porcentaje) / 100);
  return centavos / 100;
}

/** Lo que queda por pagar después de la seña. */
export function saldo(precio: number, lugares: number, porcentaje: number) {
  return Math.round((precio * lugares - montoSena(precio, lugares, porcentaje)) * 100) / 100;
}
