import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SkipLink } from "@/components/SkipLink";
import { WhatsAppButton } from "@/components/WhatsAppButton";

/**
 * Header, footer y botón de WhatsApp del sitio público. Lo usan el layout de
 * (sitio) y el 404; el panel de administración tiene su propio layout.
 */
export function SitioChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <AnnouncementBar />
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
