import Link from "next/link";
import { Adaptive } from "@/components/Adaptive";
import { Eyebrow } from "@/components/Eyebrow";
import { ProductCard } from "@/components/ProductCard";
import { pages } from "@/data/site";
import type { Product } from "@/lib/data";

const { favorites } = pages.home;

export function Favorites({ products }: { products: Product[] }) {
  return (
    <section aria-labelledby="favoritos-titulo" className="contenedor flex flex-col gap-5 py-12 lg:gap-10 lg:py-24">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-3">
          <Eyebrow className="hidden lg:block">{favorites.eyebrow}</Eyebrow>
          <h2 id="favoritos-titulo" className="text-34 lg:text-48">
            <Adaptive full={favorites.title.full} short={favorites.title.short} />
          </h2>
        </div>
        <Link
          href={favorites.cta.href}
          className="py-2.5 text-15 font-semibold text-chocolate underline hover:text-carbon lg:py-0"
        >
          {favorites.cta.label} <span aria-hidden="true" className="font-simbolos">→</span>
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-4 lg:gap-8">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard
              product={product}
              variant="inicio"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
