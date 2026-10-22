// Número de WhatsApp de una inscripta → formato internacional de wa.me.
//
// Las inscriptas cargan el número como les sale ("11 5555-6666",
// "011 15 5555 6666", "+54 9 11 5555 6666"). Para Argentina, wa.me pide
// 54 + 9 + código de área (sin 0) + número (sin 15). Es una heurística: con
// área de 2 a 4 dígitos, el "15" después del área no siempre se puede
// distinguir. TODO: pedir el número separado (área + número) en el formulario.

/** "5491155556666", o null si no parece un número argentino. */
export function waNumero(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("54")) d = d.slice(2);
  if (d.startsWith("9") && d.length === 11) d = d.slice(1);
  if (d.startsWith("0")) d = d.slice(1);
  // 11 15 5555 6666 → área 11 + 15 + 8 dígitos (Buenos Aires)
  if (d.length === 12 && d.startsWith("11") && d.slice(2, 4) === "15") d = `11${d.slice(4)}`;
  // Otras áreas con 15: 351 15 555 6666 (13 dígitos con el 15 en el medio)
  if (d.length === 12 && !d.startsWith("11")) {
    const sin15 = d.replace(/^(\d{2,4})15/, "$1");
    if (sin15.length === 10) d = sin15;
  }
  return d.length === 10 ? `549${d}` : null;
}

/** Link de wa.me con un mensaje. Sin número válido, el link abre WhatsApp solo con el texto. */
export function waLink(numero: string, mensaje: string) {
  const n = waNumero(numero);
  const texto = encodeURIComponent(mensaje);
  return n ? `https://wa.me/${n}?text=${texto}` : `https://wa.me/?text=${texto}`;
}
