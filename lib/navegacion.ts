/**
 * Si un link del menú corresponde a la página actual (aria-current="page").
 *
 * La home es estática (ISR): cuando Vercel la regenera, usePathname()
 * devuelve "/index" en lugar de "/", en el HTML y después de hidratar
 * (Bug 4 en docs/testing.md). Por eso "/index" cuenta como el inicio.
 */
export function esPaginaActual(pathname: string, href: string) {
  const ruta = pathname === "/index" ? "/" : pathname;
  return href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`);
}
