import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Rich } from "@/components/Rich";
import { CatalogFromUrl, CatalogView } from "@/components/tienda/ProductCatalog";
import { pages } from "@/data/site";
import { getProductCategories, getProducts } from "@/lib/data";

const content = pages.tienda;

export const metadata: Metadata = content.metadata;

// ISR: cada cambio de un producto desde el panel la regenera al instante
// (lib/admin/revalidar.ts). Los 5 minutos quedan para la temporada, que
// cambia sola con el mes.
export const revalidate = 300;

export default async function TiendaPage() {
  const [products, categories] = await Promise.all([getProducts(), getProductCategories()]);

  return (
    <div className="contenedor flex flex-col gap-9 pt-7 pb-12 lg:pt-14 lg:pb-24">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="flex flex-col gap-3.5">
          <nav aria-label={content.breadcrumb.label}>
            <ol className="flex gap-1 text-14 text-secundario">
              <li>
                <Link href="/" className="text-secundario underline hover:text-carbon">
                  {content.breadcrumb.home}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{content.title}</li>
            </ol>
          </nav>
          <h1 className="text-44 lg:text-64">{content.title}</h1>
        </div>
        <div className="flex shrink-0 flex-col gap-3">
          <dl className="flex flex-col gap-1.5 rounded-card bg-arena px-5 py-4 text-14 leading-normal lg:px-7 lg:py-5 lg:text-15">
            {content.facts.map((fact) => (
              <div key={fact.term}>
                <dt className="inline font-bold">{fact.term}:</dt> <dd className="inline">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-14 text-secundario lg:text-15">
            <Rich text={content.event} />
          </p>
        </div>
      </div>

      {/* El filtro lee ?categoria= en el cliente: el fallback (todo el catálogo)
          es lo que se prerenderiza, así la página sigue siendo estática. */}
      <Suspense fallback={<CatalogView products={products} categories={categories} category={null} />}>
        <CatalogFromUrl products={products} categories={categories} />
      </Suspense>
    </div>
  );
}
