import Link from "next/link";
import type { ReactNode } from "react";
import { pages, ui } from "@/data/site";
import type { Product } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { Eyebrow } from "./Eyebrow";
import { ImageFrame } from "./ImageFrame";

const { card } = pages.tienda;

type ProductCardProps = {
  product: Product;
  /**
   * inicio: en mobile muestra solo foto, nombre y precio.
   * tienda: siempre completa, con el botón de `action`.
   */
  variant: "inicio" | "tienda";
  headingLevel?: "h2" | "h3";
  action?: ReactNode;
};

/** Línea chica debajo del nombre: presentación, porciones o medida. */
function detailOf(product: Product) {
  return card.detail(product.presentation ?? product.servings ?? product.measure);
}

/**
 * Tarjeta de producto del mockup: foto, categoría, nombre con precio y
 * detalle. Toda la tarjeta lleva al detalle (el link está en el nombre y se
 * estira sobre la tarjeta); el botón de `action` queda por encima.
 */
export function ProductCard({ product, variant, headingLevel: Heading = "h3", action }: ProductCardProps) {
  const [image] = product.images;
  const [size] = product.sizes;
  const price = size?.price ?? null;
  const inicio = variant === "inicio";
  // Solo en el inicio mobile se ocultan la categoría y el detalle.
  const extra = inicio ? "hidden lg:block" : "";
  const badges = [product.custom && card.custom, !product.inSeason && card.outOfSeason].filter(Boolean);

  return (
    <article className={`relative flex h-full flex-col ${inicio ? "gap-1.5 lg:gap-3" : "gap-2.5"}`}>
      <ImageFrame
        src={image?.src}
        alt={image?.alt ?? ""}
        placeholderLabel={ui.imagePending}
        className="aspect-37/45"
        sizes="(min-width: 1024px) 25vw, 50vw"
      />
      <Eyebrow small className={`${extra} ${inicio ? "" : "mt-1"}`}>
        {product.category.name}
      </Eyebrow>
      {/* Sin precio, el aviso va debajo del nombre: al lado lo cortaría. */}
      <div
        className={`mt-1 flex flex-col gap-1.5 lg:mt-0 ${
          price === null ? "" : "xl:flex-row xl:items-baseline xl:justify-between xl:gap-2"
        }`}
      >
        <Heading className="text-21 lg:text-26">
          <Link
            href={`/tienda/${product.slug}`}
            className="no-underline after:absolute after:inset-0 after:rounded-card-sm hover:text-chocolate"
          >
            {product.name}
          </Link>
        </Heading>
        {price === null ? (
          <p className="text-15 font-semibold text-secundario lg:text-16">{ui.priceTbd}</p>
        ) : (
          <p className="shrink-0 text-15 font-semibold lg:text-16">{formatPrice(price)}</p>
        )}
      </div>
      <p className={`text-14 text-secundario ${extra}`}>{detailOf(product)}</p>
      {badges.length > 0 && (
        <ul className={`flex flex-wrap gap-1.5 ${extra}`}>
          {badges.map((badge) => (
            <li key={String(badge)} className="rounded-full bg-arena px-2.5 py-1 text-12 font-semibold text-chocolate">
              {badge}
            </li>
          ))}
        </ul>
      )}
      {action && <div className="relative z-10 flex flex-col pt-1.5">{action}</div>}
    </article>
  );
}
