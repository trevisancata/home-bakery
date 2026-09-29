import Link from "next/link";
import { navigation, site } from "@/data/site";

export function Footer() {
  return (
    <footer className="bg-carbon text-hueso">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-display text-2xl">{site.name}</p>
          <p className="mt-3 max-w-sm">{site.tagline}</p>
        </div>

        <div>
          <h2 className="font-sans text-sm font-bold tracking-widest text-hueso uppercase">
            Contacto
          </h2>
          <address className="mt-4 space-y-2 not-italic">
            <p>
              <a href={site.contact.whatsapp.url} className="underline hover:no-underline">
                {site.contact.whatsapp.label} {site.contact.whatsapp.display}
              </a>
            </p>
            <p>{site.city}</p>
          </address>
        </div>

        <div>
          <h2 className="font-sans text-sm font-bold tracking-widest text-hueso uppercase">
            Redes
          </h2>
          <ul className="mt-4 space-y-2">
            <li>
              <a href={site.contact.instagram.url} className="underline hover:no-underline">
                {site.contact.instagram.label} {site.contact.instagram.display}
              </a>
            </li>
          </ul>
        </div>

        <nav aria-label="Secundaria" className="sm:col-span-2 lg:col-span-4">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 border-t border-hueso/20 pt-6">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="underline hover:no-underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="px-4 pb-8 text-center text-sm">
        © {new Date().getFullYear()} {site.name}. Hecho a mano en {site.city}.
      </p>
    </footer>
  );
}
