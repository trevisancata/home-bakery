"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { ProductCard } from "@/components/ProductCard";
import { pages, whatsappLink, whatsappMessages } from "@/data/site";
import type { Product, ProductCategory } from "@/lib/data";

const content = pages.tienda;

type Sort = (typeof content.sort.options)[number]["value"];

const priceOf = (product: Product) => product.sizes[0]?.price ?? null;

/** Ordena por precio; los productos sin precio confirmado van siempre al final. */
function byPrice(direction: 1 | -1) {
  return (a: Product, b: Product) => {
    const priceA = priceOf(a);
    const priceB = priceOf(b);
    if (priceA === null || priceB === null) return (priceA === null ? 1 : 0) - (priceB === null ? 1 : 0);
    return (priceA - priceB) * direction;
  };
}

type CatalogProps = { products: Product[]; categories: ProductCategory[] };

/**
 * Catálogo filtrado por la categoría de la URL (?categoria=). Usa
 * useSearchParams, así que la página lo envuelve en un <Suspense> con
 * CatalogView completo de fallback: /tienda sigue siendo estática.
 */
export function CatalogFromUrl(props: CatalogProps) {
  const router = useRouter();
  const category = useSearchParams().get("categoria");

  return (
    <CatalogView
      {...props}
      category={category}
      onCategoryChange={(slug) =>
        router.replace(slug ? `/tienda?categoria=${encodeURIComponent(slug)}` : "/tienda", { scroll: false })
      }
    />
  );
}

type CatalogViewProps = CatalogProps & {
  /** Slug de la categoría filtrada, o null para ver todo. */
  category: string | null;
  onCategoryChange?: (slug: string | null) => void;
};

/** Filtros por categoría, orden y grilla de productos de la tienda. */
export function CatalogView({ products, categories, category, onCategoryChange }: CatalogViewProps) {
  const [sort, setSort] = useState<Sort>("destacados");

  const current = categories.find((item) => item.slug === category);
  const visible = products.filter((product) => !category || product.category.slug === category);
  if (sort === "menor-precio") visible.sort(byPrice(1));
  if (sort === "mayor-precio") visible.sort(byPrice(-1));

  const chips = [
    { slug: null, label: content.filter.all },
    ...categories.map((item) => ({ slug: item.slug, label: item.name })),
  ];

  return (
    <>
      <div className="flex flex-col gap-4 border-y border-borde py-4.5 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label={content.filter.label}
          className="-mx-4 flex gap-2.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0"
        >
          {chips.map((chip) => {
            const pressed = chip.slug === category || (chip.slug === null && category === null);
            return (
              <button
                key={chip.label}
                type="button"
                aria-pressed={pressed}
                onClick={() => onCategoryChange?.(chip.slug)}
                className={`h-11 shrink-0 rounded-full border px-5 text-14 ${
                  pressed
                    ? "border-carbon bg-chocolate font-semibold text-hueso"
                    : "border-borde-control bg-hueso font-medium text-carbon hover:border-chocolate"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2.5 text-14 text-secundario">
          {content.sort.label}
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            className="h-11 rounded-full border border-borde-control bg-hueso px-4 text-14 text-carbon"
          >
            {content.sort.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-baseline justify-between gap-4">
        <h2 id="catalogo-titulo" className="text-30 lg:text-40">
          {current?.name ?? content.allTitle}
        </h2>
        <p className="text-14 text-secundario" aria-live="polite">
          {content.results(visible.length)}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-3xl bg-arena p-6 lg:p-10">
          <p className="text-17">{content.empty.text}</p>
          <Button variant="secondary" size="sm" onClick={() => onCategoryChange?.(null)}>
            {content.empty.cta}
          </Button>
        </div>
      ) : (
        <ul
          aria-labelledby="catalogo-titulo"
          className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12"
        >
          {visible.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                variant="tienda"
                action={
                  product.custom ? (
                    <Button
                      href={whatsappLink(whatsappMessages.customProduct(product.name))}
                      variant="secondary"
                      size="sm"
                    >
                      {content.product.customCta}
                      <span className="sr-only">: {product.name}</span>
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" disabled>
                      {product.inSeason ? content.card.soon : content.card.outOfSeason}
                      <span className="sr-only">{content.card.soonContext(product.name)}</span>
                    </Button>
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
