"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navigation, ui } from "@/data/site";
import { unidadesCarrito } from "@/lib/carrito/lineas";
import { useCarrito } from "./carrito/CarritoProvider";
import { Logo } from "./Logo";

const MENU_ID = "menu-mobile";

/**
 * Header fijo: se mantiene visible al scrollear. En mobile el orden es
 * menú · logo · carrito y el menú se despliega debajo (aria-expanded +
 * aria-controls; Escape o un clic afuera lo cierran). Desde md el menú
 * queda siempre visible entre el logo y el carrito.
 *
 * El carrito muestra cuántos productos hay: el número es visual y el total
 * va en el aria-label; "Agregaste … al pedido" se anuncia con aria-live.
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

  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-borde bg-hueso">
      <div className="contenedor flex items-center justify-between py-3 lg:py-5.5">
        <button
          ref={toggleRef}
          type="button"
          aria-label={ui.menuButton}
          aria-expanded={open}
          aria-controls={MENU_ID}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex size-11 items-center justify-center rounded-full text-carbon md:hidden"
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

        <Link href="/" className="rounded-full">
          <Logo alt={ui.homeLink} className="size-14 lg:size-19" imageClassName="w-10 lg:w-13.5" />
        </Link>

        <nav aria-label={ui.mainNavLabel} className="hidden md:block">
          <ul className="flex gap-8 text-15 font-medium lg:gap-10">
            {navigation.map((item) => {
              const current = isCurrent(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`block border-b-trazo py-1.5 text-carbon no-underline hover:border-chocolate ${
                      current ? "border-chocolate" : "border-transparent"
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
          className="relative inline-flex size-11 items-center justify-center rounded-full text-carbon hover:bg-arena md:size-12 md:border md:border-borde"
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
              className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-chocolate px-1 text-12 font-semibold text-hueso"
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
        className="absolute inset-x-0 top-full border-b border-borde bg-hueso px-4 pt-2 pb-5 md:hidden"
      >
        <ul>
          {navigation.map((item) => {
            const current = isCurrent(item.href);
            return (
              <li key={item.href} className="border-b border-borde-suave last:border-b-0">
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`block py-4 font-sans text-15 font-medium tracking-foto uppercase no-underline ${
                    current ? "text-chocolate" : "text-carbon"
                  }`}
                >
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
