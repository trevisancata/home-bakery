import Link from "next/link";
import { navigation, site } from "@/data/site";

export function Footer() {
  return (
    <footer className="bg-cacao text-crema">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-serif text-2xl font-semibold">{site.name}</p>
          <p className="mt-3 max-w-sm">{site.tagline}</p>
        </div>

        <div>
          <h2 className="font-sans text-sm font-bold tracking-widest text-crema uppercase">
            Contacto
          </h2>
          <address className="mt-4 space-y-2 not-italic">
            <p>
              <a href={`mailto:${site.contact.email}`} className="underline hover:no-underline">
                {site.contact.email}
              </a>
            </p>
            <p>
              <a href={site.contact.whatsappUrl} className="underline hover:no-underline">
                WhatsApp {site.contact.whatsapp}
              </a>
            </p>
            <p>{site.city}</p>
          </address>
        </div>

        <div>
          <h2 className="font-sans text-sm font-bold tracking-widest text-crema uppercase">
            Redes
          </h2>
          <ul className="mt-4 space-y-2">
            {site.social.map((network) => (
              <li key={network.name}>
                <a href={network.url} className="underline hover:no-underline">
                  {network.name}
                  <span className="sr-only"> de {site.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Secundaria" className="sm:col-span-2 lg:col-span-4">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 border-t border-crema/20 pt-6">
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
