import Link from "next/link";
import { site, ui } from "@/data/site";
import { Logo } from "./Logo";

const titleClasses = "font-sans text-15 font-bold text-hueso";
const linkClasses = "text-hueso underline md:no-underline hover:text-white hover:underline";

/**
 * Footer en chocolate, el mismo en todas las páginas. En mobile, como en el
 * mockup, muestra solo el logo, los contactos y el copyright; desde md suma
 * los links y los horarios, en cuatro columnas desde lg y sin copyright.
 */
export function Footer() {
  const { instagram, whatsapp } = site.contact;
  const hours = [...site.hours, site.closed];

  return (
    <footer data-surface="dark" className="bg-chocolate text-hueso">
      <div className="contenedor flex flex-col gap-5 pt-10 pb-7 md:pb-9 lg:pt-18">
        <div className="flex flex-col gap-5 text-15 md:grid md:grid-cols-2 md:gap-12 lg:grid-cols-4">
          <Logo alt={site.name} circle={false} className="w-19.5 lg:w-22.5" />

          <nav aria-label={ui.footer.navLabel} className="hidden md:block">
            <h2 className={titleClasses}>{ui.footer.navTitle}</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {ui.footer.links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClasses}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden md:block">
            <h2 className={titleClasses}>{ui.footer.hoursTitle}</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {hours.map((slot) => (
                <li key={slot.days}>{ui.footer.hoursItem(slot)}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={`hidden md:block ${titleClasses}`}>{ui.footer.contactTitle}</h2>
            <address className="flex flex-col gap-5 not-italic md:mt-3 md:gap-3">
              <a href={instagram.url} className={`py-1.5 md:py-0 ${linkClasses}`}>
                {instagram.label} {instagram.display}
              </a>
              <a href={whatsapp.url} className={`py-1.5 md:py-0 ${linkClasses}`}>
                {whatsapp.label} {whatsapp.display}
              </a>
            </address>
          </div>
        </div>

        <p className="border-t border-chocolate-claro pt-4 text-13 text-hueso-suave md:hidden">
          {ui.footer.copyright(new Date().getFullYear())}
        </p>
      </div>
    </footer>
  );
}
