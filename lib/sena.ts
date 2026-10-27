// Lo que se paga al inscribirse a un workshop. El monto que se cobra lo
// calcula siempre la base (crear_inscripcion, migración 0003); esta es la
// misma cuenta para mostrarlo en el formulario antes de enviar. El
// porcentaje es el de cada workshop (sena_porcentaje, nombre interno): 100%
// desde la migración 0006, porque Maggie decidió cobrar el total al
// inscribirse.

/** Monto = precio × lugares × porcentaje / 100, redondeado al centavo (igual que la base). */
export function montoSena(precio: number, lugares: number, porcentaje: number) {
  // En centavos para no arrastrar errores de punto flotante (0.1 + 0.2).
  const centavos = Math.round((Math.round(precio * 100) * lugares * porcentaje) / 100);
  return centavos / 100;
}
