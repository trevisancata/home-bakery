import Link from "next/link";
import { site } from "@/data/site";
import { Navigation } from "./Navigation";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-cacao/10 bg-crema/95 backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="font-serif text-2xl font-semibold no-underline">
          {site.name}
        </Link>
        <Navigation />
      </div>
    </header>
  );
}
