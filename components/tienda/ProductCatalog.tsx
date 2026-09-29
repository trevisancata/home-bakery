"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { ProductCard } from "@/components/ProductCard";
import { pages } from "@/data/site";
import type { Product, ProductCategory } from "@/lib/data";

const content = pages.tienda;

type Sort = (typeof content.sort.options)[number]["value"];

const byPrice = (product: Product) => product.sizes[0].price;

/** Filtros por categoría, orden y grilla de productos de la tienda. */
export function ProductCatalog({ products, categories }: { products: Product[]; categories: ProductCategory[] }) {
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [sort, setSort] = useState<Sort>("destacados");

  const visible = products.filter((product) => !category || product.category === category);
  if (sort === "menor-precio") visible.sort((a, b) => byPrice(a) - byPrice(b));
  if (sort === "mayor-precio") visible.sort((a, b) => byPrice(b) - byPrice(a));

  const chips = [{ value: null, label: content.filter.all }, ...categories.map((value) => ({ value, label: value }))];

  return (
    <>
      <div className="flex flex-col gap-4 border-y border-borde py-4.5 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label={content.filter.label}
          className="-mx-4 flex gap-2.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0"
        >
          {chips.map((chip) => {
            const pressed = chip.value === category;
            return (
              <button
                key={chip.label}
                type="button"
                aria-pressed={pressed}
                onClick={() => setCategory(chip.value)}
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

      <p className="sr-only" aria-live="polite">
        {content.results(visible.length)}
      </p>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
        {visible.map((product) => (
          <li key={product.id}>
            <ProductCard
              product={product}
              variant="tienda"
              headingLevel="h2"
              detail={content.card.detail(product.sizes[0].label)}
              action={
                <Button variant="secondary" size="sm" disabled>
                  {content.card.soon}
                  <span className="sr-only">{content.card.soonContext(product.name)}</span>
                </Button>
              }
            />
          </li>
        ))}
      </ul>
    </>
  );
}
