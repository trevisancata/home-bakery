"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cerrarSesion } from "@/app/admin/actions";
import { Logo } from "@/components/Logo";
import { Icono, type NombreIcono } from "@/components/admin/ui/Icono";
import { admin } from "@/data/admin";

const content = admin.panel;

/** /admin solo está activo en el inicio; el resto, también en sus subpáginas. */
function activo(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Navegación del panel, como docs/mockup/admin-*.html:
 * - desktop: barra lateral chocolate con la usuaria, las secciones y "Ver la web";
 * - mobile: barra de arriba con la cuenta y barra de abajo con las secciones.
 */
export function PanelNav({ nombre }: { nombre: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop */}
      <aside
        data-surface="dark"
        className="sticky top-0 hidden h-dvh w-65 shrink-0 flex-col gap-8 overflow-y-auto bg-chocolate px-5 py-7 lg:flex"
      >
        <div className="flex items-center gap-3">
          <Logo alt={admin.brandAlt} className="size-13" imageClassName="w-[70%]" />
          <div className="flex flex-col gap-0.5">
            <strong className="text-15 text-white">{content.hello(nombre)}</strong>
            <span className="text-13 text-crema-suave">{content.subtitle}</span>
          </div>
        </div>
        <nav aria-label={content.navLabel} className="flex flex-col gap-1">
          {content.nav.map((item) => {
            const actual = activo(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={actual ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-xl px-4 text-15 no-underline ${
                  actual ? "bg-hueso font-semibold text-carbon" : "text-crema-suave hover:bg-chocolate-claro hover:text-white"
                }`}
              >
                <Icono nombre={item.icon as NombreIcono} />
                {item.label}
              </Link>
            );
          })}
          <span aria-disabled="true" className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-15 text-crema-suave">
            <Icono nombre="pedidos" />
            <span className="flex flex-col">
              {content.orders.label}
              <span className="text-12">{content.orders.note}</span>
            </span>
          </span>
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-15 text-crema-suave no-underline hover:bg-chocolate-claro hover:text-white"
          >
            <Icono nombre="web" />
            {content.viewSite}
            <span className="sr-only">{content.viewSiteContext}</span>
          </a>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-15 text-crema-suave hover:bg-chocolate-claro hover:text-white"
            >
              <Icono nombre="usuaria" />
              {content.signOut}
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile: arriba, la cuenta */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-borde bg-hueso px-2 py-2 lg:hidden">
        <Link href="/admin" className="flex min-h-11 items-center gap-2 rounded-full px-2 no-underline">
          <Logo alt={admin.brandAlt} className="size-10" imageClassName="w-[70%]" />
          <span className="text-15 font-semibold text-carbon">{content.hello(nombre)}</span>
        </Link>
        <details className="relative">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full px-3 text-14 font-semibold text-chocolate [&::-webkit-details-marker]:hidden">
            <Icono nombre="usuaria" />
            {content.account}
          </summary>
          <div className="absolute right-0 z-40 mt-2 flex w-64 flex-col gap-1 rounded-2xl border border-borde bg-white p-2 shadow-lg">
            <a href="/" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-15 text-carbon no-underline hover:bg-arena">
              <Icono nombre="web" />
              {content.viewSite}
              <span className="sr-only">{content.viewSiteContext}</span>
            </a>
            <span aria-disabled="true" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-15 text-secundario">
              <Icono nombre="pedidos" />
              {content.orders.label} · {content.orders.note}
            </span>
            <form action={cerrarSesion}>
              <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-15 text-carbon hover:bg-arena">
                <Icono nombre="usuaria" />
                {content.signOut}
              </button>
            </form>
          </div>
        </details>
      </header>

      {/* Mobile: abajo, las secciones */}
      <nav
        aria-label={content.navLabel}
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-borde bg-white px-1 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        {content.nav.map((item) => {
          const actual = activo(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={actual ? "page" : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 text-12 no-underline ${
                actual ? "font-semibold text-chocolate" : "text-secundario"
              }`}
            >
              <Icono nombre={item.icon as NombreIcono} size={22} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
