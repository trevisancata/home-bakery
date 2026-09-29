import { site, ui } from "@/data/site";

/**
 * Botón flotante de WhatsApp, presente en todas las páginas. En mobile es
 * solo el ícono; el aria-label incluye el texto visible de desktop.
 */
export function WhatsAppButton() {
  return (
    <a
      href={site.contact.whatsapp.url}
      aria-label={ui.whatsappFloat.label}
      className="fixed right-4 bottom-4 z-40 inline-flex size-14 items-center justify-center gap-2 rounded-full bg-whatsapp font-medium text-whatsapp-oscuro no-underline shadow-lg ring-2 ring-hueso transition-transform hover:scale-105 focus-visible:outline-whatsapp-oscuro motion-reduce:transition-none motion-reduce:hover:scale-100 sm:right-6 sm:bottom-6 md:size-auto md:min-h-12 md:px-5"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7 shrink-0 md:size-6" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
        <path d="M16.6 14.1c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.4-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z" />
      </svg>
      <span className="hidden md:inline">{ui.whatsappFloat.text}</span>
    </a>
  );
}
