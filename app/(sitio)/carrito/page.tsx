import type { Metadata } from "next";
import { Carrito } from "@/components/carrito/Carrito";
import { pages } from "@/data/site";

const content = pages.carrito;

export const metadata: Metadata = content.metadata;

/** El carrito vive en el navegador (localStorage): la página es estática y lo lee el cliente. */
export default function CarritoPage() {
  // Al menos una pantalla de alto: el carrito se lee después de hidratar, y con
  // el footer fuera de la vista al cargar, que el contenido crezca no lo hace saltar (CLS).
  return (
    <div className="contenedor flex min-h-svh flex-col gap-6 pt-8 pb-16 lg:gap-10 lg:pt-12 lg:pb-26">
      <h1 className="text-40 leading-titulo lg:text-56">{content.title}</h1>
      <Carrito />
    </div>
  );
}
