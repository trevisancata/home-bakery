import Link from "next/link";
import { navigation, site, ui } from "@/data/site";
import { Logo } from "./Logo";

const titleClasses = "font-label text-sm tracking-[0.2em] text-hueso uppercase";
const linkClasses = "underline decoration-hueso/40 hover:decoration-hueso";

export function Footer() {
  const { instagram, whatsapp } = site.contact;

  return (
    <footer data-surface="dark" className="bg-chocolate text-hueso">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-14 pb-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:pt-20">
        <div>
          <Logo alt={site.name} circle={false} className="w-32" />
          <p className="mt-4 font-display text-xl">{site.tagline}</p>
        </div>

        <nav aria-label={ui.footer.navLabel}>
          <h2 className={titleClasses}>{ui.footer.navTitle}</h2>
          <ul className="mt-4 space-y-2">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClasses}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={titleClasses}>{ui.footer.hoursTitle}</h2>
          <dl className="mt-4 space-y-2">
            {site.hours.map((slot) => (
              <div key={slot.days} className="flex gap-2">
                <dt>{slot.days}</dt>
                <dd>{slot.time}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4">{site.leadTime}</p>
          <p>{site.pickup}</p>
        </div>

        <div>
          <h2 className={titleClasses}>{ui.footer.contactTitle}</h2>
          <address className="mt-4 space-y-2 not-italic">
            <p>
              <a href={instagram.url} className={linkClasses}>
                {instagram.label} {instagram.display}
              </a>
            </p>
            <p>
              <a href={whatsapp.url} className={linkClasses}>
                {whatsapp.label} {whatsapp.display}
              </a>
            </p>
          </address>
        </div>
      </div>

      {/* pb-24: deja lugar para el botón flotante de WhatsApp. */}
      <p className="mx-auto max-w-6xl border-t border-hueso/20 px-4 pt-6 pb-24 text-center text-sm sm:px-6">
        {ui.footer.copyright(new Date().getFullYear())}
      </p>
    </footer>
  );
}
