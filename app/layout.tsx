import type { Metadata } from "next";
import { DM_Sans, Gilda_Display, Mrs_Saint_Delafield, Oswald } from "next/font/google";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SkipLink } from "@/components/SkipLink";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { pages, site } from "@/data/site";
import "./globals.css";

// Gilda Display y Mrs Saint Delafield no son variables: requieren peso.
const gildaDisplay = Gilda_Display({
  variable: "--font-gilda-display",
  subsets: ["latin"],
  weight: "400",
});

const mrsSaintDelafield = Mrs_Saint_Delafield({
  variable: "--font-mrs-saint-delafield",
  subsets: ["latin"],
  weight: "400",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: pages.layout.title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [...site.keywords],
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: site.name,
    title: site.name,
    description: site.description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${gildaDisplay.variable} ${mrsSaintDelafield.variable} ${oswald.variable} ${dmSans.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        <AnnouncementBar />
        <Header />
        <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
