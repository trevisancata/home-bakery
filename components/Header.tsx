import Link from "next/link";
import { ui } from "@/data/site";
import { Logo } from "./Logo";
import { Navigation } from "./Navigation";

/** Header fijo: se mantiene visible al scrollear. */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-greige bg-hueso/95 backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 sm:px-6">
        <Link href="/" className="mr-auto rounded-full md:mr-0">
          <Logo alt={ui.homeLink} className="size-16 lg:size-18" />
        </Link>

        <Navigation />

        <Link
          href={ui.cart.href}
          aria-label={ui.cart.label}
          className="inline-flex size-11 items-center justify-center rounded-full text-carbon hover:bg-arena hover:text-chocolate"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z" />
            <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
