import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/carrito/CheckoutForm";
import { pages } from "@/data/site";

const content = pages.checkout;

export const metadata: Metadata = content.metadata;

/** El carrito vive en el navegador: el formulario lo lee del lado del cliente. */
export default function CheckoutPage() {
  // Al menos una pantalla de alto: el carrito se lee después de hidratar, y con
  // el footer fuera de la vista al cargar, que el contenido crezca no lo hace saltar (CLS).
  return (
    <div className="contenedor flex min-h-svh flex-col gap-6 pt-8 pb-16 lg:gap-10 lg:pt-12 lg:pb-26">
      <div className="flex flex-col gap-3">
        <nav aria-label={content.breadcrumb.label}>
          <ol className="flex gap-1 text-14 text-secundario">
            <li>
              <Link href={content.breadcrumb.parent.href} className="text-secundario underline hover:text-carbon">
                {content.breadcrumb.parent.label}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{content.breadcrumb.current}</li>
          </ol>
        </nav>
        <h1 className="text-40 leading-titulo lg:text-56">{content.title}</h1>
      </div>
      <CheckoutForm />
    </div>
  );
}
