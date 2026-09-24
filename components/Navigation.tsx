"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type KeyboardEvent } from "react";
import { navigation } from "@/data/site";

const MENU_ID = "menu-principal";

/**
 * Navegación principal. En mobile la lista se muestra y oculta con un botón
 * (aria-expanded + aria-controls); Escape cierra el menú y devuelve el foco
 * al botón. Desde md en adelante la lista está siempre visible.
 */
export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && open) {
      setOpen(false);
      toggleRef.current?.focus();
    }
  }

  return (
    <nav aria-label="Principal" onKeyDown={handleKeyDown}>
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={MENU_ID}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-cacao px-4 font-semibold md:hidden"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
        Menú
      </button>

      <ul
        id={MENU_ID}
        className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col gap-1 border-b border-cacao/10 bg-crema px-4 pt-2 pb-6 shadow-md md:static md:flex md:flex-row md:gap-2 md:border-0 md:p-0 md:shadow-none`}
      >
        {navigation.map((item) => {
          const current =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`block rounded-full px-4 py-3 font-semibold no-underline hover:bg-rosa md:py-2 ${
                  current ? "bg-rosa text-terracota" : ""
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
