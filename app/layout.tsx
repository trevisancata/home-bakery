import type { Metadata } from "next";
// La cursiva va con alias: para probar otra (p. ej. Dawning_of_a_New_Day)
// alcanza con cambiar el nombre en esta línea.
import { Gloock, Poppins, Sacramento as Cursiva } from "next/font/google";
import { pages, site } from "@/data/site";
import "./globals.css";

// Ninguna de las tres es variable: requieren peso.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const gloock = Gloock({
  variable: "--font-gloock",
  subsets: ["latin"],
  weight: "400",
});

const cursiva = Cursiva({
  variable: "--font-cursiva",
  subsets: ["latin"],
  weight: "400",
});

// Tamaño de la palabra manuscrita (en em del título) para cada cursiva,
// calibrado contra el mockup aprobado: con el 1.75em de antes, Sacramento
// queda ~35% más grande. Dawning es más fina y de ascendentes bajos.
const tamanoManuscrita: Record<string, string> = {
  Sacramento: "1.4em",
  "Dawning of a New Day": "1.7em",
};
const familiaCursiva = cursiva.style.fontFamily.split(",")[0].replaceAll("'", "");

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
    <html
      lang="es-AR"
      className={`${poppins.variable} ${gloock.variable} ${cursiva.variable}`}
      style={{ "--tamano-manuscrita": tamanoManuscrita[familiaCursiva] } as React.CSSProperties}
    >
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
