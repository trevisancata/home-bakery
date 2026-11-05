"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navigation, ui } from "@/data/site";
import { unidadesCarrito } from "@/lib/carrito/lineas";
import { esPaginaActual } from "@/lib/navegacion";
import { useCarrito } from "./carrito/CarritoProvider";
import { Logo } from "./Logo";

const MENU_ID = "menu-mobile";

/**
 * Logo del header: el blanco sin círculo. Con círculo (true), el taupe del
 * círculo queda apenas más claro que el fondo del header (1.42:1) y se lee
 * como un disco desteñido.
 */
const LOGO_EN_CIRCULO = false;

/**
 * Header fijo: se mantiene visible al scrollear. En mobile el orden es
 * menú · logo · carrito y el menú se despliega debajo (aria-expanded +
 * aria-controls; Escape o un clic afuera lo cierran). Desde md el menú
 * queda siempre visible entre el logo y el carrito.
 *
 * El carrito muestra cuántos productos hay: el número es visual y el total
 * va en el aria-label; "Agregaste … al pedido" se anuncia con aria-live.
 *
 * Fondo taupe-header (el taupe del logo, apenas más oscuro): el menú, los
 * íconos y el contador van en blanco (4.55:1) y el foco en hueso (4.13:1),
 * por data-surface="dark". Contrastes en app/globals.css.
 */
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { lines, announcement } = useCarrito();
  const count = unidadesCarrito(lines);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  const isCurrent = (href: string) => esPaginaActual(pathname, href);

  return (
    <header ref={headerRef} data-surface="dark" className="sticky top-0 z-40 bg-taupe-header">
      <div className="contenedor flex items-center justify-between py-3 lg:py-5.5">
        <button
          ref={toggleRef}
          type="button"
          aria-label={ui.menuButton}
          aria-expanded={open}
          aria-controls={MENU_ID}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex size-11 items-center justify-center rounded-full text-white hover:bg-white/15 md:hidden"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>

        {LOGO_EN_CIRCULO ? (
          <Link href="/" className="rounded-full">
            <Logo alt={ui.homeLink} className="size-14 lg:size-19" imageClassName="w-10 lg:w-13.5" />
          </Link>
        ) : (
          // Mismo alto que el círculo, así el header no cambia de tamaño.
          <Link href="/" className="flex size-14 items-center justify-center lg:size-19">
            <Logo alt={ui.homeLink} circle={false} loading="eager" className="w-12 lg:w-16" />
          </Link>
        )}

        <nav aria-label={ui.mainNavLabel} className="hidden md:block">
          <ul className="flex gap-8 text-15 font-medium lg:gap-10">
            {navigation.map((item) => {
              const current = isCurrent(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`block border-b-trazo py-1.5 text-white no-underline ${
                      current ? "border-white" : "border-transparent hover:border-white/60"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link
          href={ui.cart.href}
          aria-label={ui.cart.count(count)}
          aria-current={isCurrent(ui.cart.href) ? "page" : undefined}
          className="relative inline-flex size-11 items-center justify-center rounded-full text-white hover:bg-white/15 md:size-12 md:border md:border-white/60"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 8h14l-1.2 12H6.2L5 8z" />
            <path d="M9 8a3 3 0 0 1 6 0" />
          </svg>
          {count > 0 && (
            <span
              aria-hidden="true"
              data-testid="carrito-contador"
              className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-12 font-semibold text-taupe-header"
            >
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Link>
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>

      <nav
        id={MENU_ID}
        aria-label={ui.mainNavLabel}
        hidden={!open}
        className="absolute inset-x-0 top-full border-t border-white/25 bg-taupe-header px-4 pt-2 pb-5 shadow-tarjeta md:hidden"
      >
        <ul>
          {navigation.map((item) => {
            const current = isCurrent(item.href);
            return (
              <li key={item.href} className="border-b border-white/25 last:border-b-0">
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 py-4 font-sans text-15 font-medium tracking-foto text-white uppercase no-underline hover:underline hover:underline-offset-4"
                >
                  {/* Página actual: una barra blanca a la izquierda, además del aria-current. */}
                  <span aria-hidden="true" className={`h-5 w-0.75 rounded-full ${current ? "bg-white" : "bg-transparent"}`} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
