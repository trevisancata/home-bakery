import type { Metadata } from "next";
// La cursiva va con alias: Maggie eligió Dawning of a New Day (29/10). Para
// cambiarla alcanza con el nombre en esta línea (y su tamaño, abajo); la que
// no se importa no se descarga.
import { Dawning_of_a_New_Day as Cursiva, Gloock, Poppins } from "next/font/google";
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

// Tamaño (en em del título) y trazo extra de la palabra manuscrita para cada
// cursiva. Sacramento: con el 1.75em de antes quedaba ~35% más grande que el
// mockup. Dawning: a 1.8em sus minúsculas miden ~1,05 veces las de Gloock
// (medido con canvas), y el trazo (text-stroke del mismo color) compensa lo
// fina que es al lado de un Gloock pesado en los tamaños chicos. Ver
// docs/guia-de-marca.md.
const manuscrita: Record<string, { tamano: string; trazo: string }> = {
  Sacramento: { tamano: "1.4em", trazo: "0em" },
  // El trazo tiene tope: en los títulos grandes (165 px) 0.025em cerraba los huecos de las letras.
  "Dawning of a New Day": { tamano: "1.8em", trazo: "min(0.025em, 1.2px)" },
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
      style={
        {
          "--tamano-manuscrita": manuscrita[familiaCursiva]?.tamano,
          "--trazo-manuscrita": manuscrita[familiaCursiva]?.trazo,
        } as React.CSSProperties
      }
    >
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
