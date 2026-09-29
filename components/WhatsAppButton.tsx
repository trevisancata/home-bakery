import { site, ui } from "@/data/site";

/** Botón flotante de WhatsApp: círculo de 60 px con el ícono, en todas las páginas. */
export function WhatsAppButton() {
  return (
    <a
      href={site.contact.whatsapp.url}
      aria-label={ui.whatsappFloat.label}
      className="fixed right-4 bottom-4 z-40 flex size-15 items-center justify-center rounded-full bg-whatsapp text-whatsapp-oscuro shadow-flotante focus-visible:outline-whatsapp-oscuro"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.5 11.6a8.6 8.6 0 0 1-12.7 7.5L3.5 20.5l1.4-4.1a8.6 8.6 0 1 1 15.6-4.8z" />
        <path d="M9 8.6c.3 2.9 2.5 5.3 5.4 5.8l1-1.2-1.7-.9-.8.7a4 4 0 0 1-2-2l.7-.8-.8-1.7z" />
      </svg>
    </a>
  );
}
