import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-cacao/10">
      <Image
        src={product.image.src}
        alt={product.image.alt}
        width={800}
        height={600}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="aspect-4/3 w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="text-sm font-bold tracking-wide text-terracota uppercase">
          {product.category}
        </p>
        <h3 className="text-xl font-semibold">{product.name}</h3>
        <p className="text-cacao-suave">{product.description}</p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-2">
          <p>
            <span className="block text-2xl font-bold">{formatPrice(product.price)}</span>
            <span className="text-sm text-cacao-suave">{product.size}</span>
          </p>
          <Link
            href="/contacto"
            className="font-semibold text-terracota underline hover:text-cacao"
          >
            Encargar<span className="sr-only"> {product.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
