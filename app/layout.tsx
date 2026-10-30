import type { Metadata } from "next";
import { Dawning_of_a_New_Day, DM_Sans, Gilda_Display, Oswald } from "next/font/google";
import { pages, site } from "@/data/site";
import "./globals.css";

// Gilda Display y Dawning of a New Day no son variables: requieren peso.
const gildaDisplay = Gilda_Display({
  variable: "--font-gilda-display",
  subsets: ["latin"],
  weight: "400",
});

// Cursiva elegida por Maggie el 29/10 (antes, Mrs Saint Delafield).
const dawning = Dawning_of_a_New_Day({
  variable: "--font-dawning",
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
    <html lang="es-AR" className={`${gildaDisplay.variable} ${dawning.variable} ${oswald.variable} ${dmSans.variable}`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
