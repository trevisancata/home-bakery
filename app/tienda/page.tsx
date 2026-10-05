import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Rich } from "@/components/Rich";
import { CatalogFromUrl, CatalogView } from "@/components/tienda/ProductCatalog";
import { pages } from "@/data/site";
import { getProductCategories, getProducts } from "@/lib/data";

const content = pages.tienda;

export const metadata: Metadata = content.metadata;

// ISR: el catálogo se regenera cada 5 minutos. TODO(E5): revalidación
// on-demand cuando Maggie edite desde el panel.
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
          <p className="max-w-140 text-17 leading-parrafo text-secundario">
            <Rich text={content.intro} />
          </p>
        </div>
        <dl className="flex shrink-0 flex-wrap gap-x-6 gap-y-3 rounded-card bg-arena px-5 py-4 text-14 leading-normal lg:px-7 lg:py-5">
          {content.facts.map((fact) => (
            <div key={fact.term} className="flex flex-col">
              <dt className="font-bold">{fact.term}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* El filtro lee ?categoria= en el cliente: el fallback (todo el catálogo)
          es lo que se prerenderiza, así la página sigue siendo estática. */}
      <Suspense fallback={<CatalogView products={products} categories={categories} category={null} />}>
        <CatalogFromUrl products={products} categories={categories} />
      </Suspense>
    </div>
  );
}
