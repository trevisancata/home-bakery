import type { ReactNode } from "react";
import { ui } from "@/data/site";
import type { Product } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { Eyebrow } from "./Eyebrow";
import { ImageFrame } from "./ImageFrame";

type ProductCardProps = {
  product: Product;
  /** Línea chica debajo del nombre (tamaño, sabores…). */
  detail: string;
  /**
   * inicio: en mobile muestra solo foto, nombre y precio.
   * tienda: siempre completa, con el botón de `action`.
   */
  variant: "inicio" | "tienda";
  headingLevel?: "h2" | "h3";
  action?: ReactNode;
};

/** Tarjeta de producto del mockup: foto, categoría, nombre con precio y detalle. */
export function ProductCard({ product, detail, variant, headingLevel: Heading = "h3", action }: ProductCardProps) {
  const [image] = product.images;
  const [size] = product.sizes;
  const inicio = variant === "inicio";
  // Solo en el inicio mobile se ocultan la categoría y el detalle.
  const extra = inicio ? "hidden lg:block" : "";

  return (
    <article className={`flex h-full flex-col ${inicio ? "gap-1.5 lg:gap-3" : "gap-2.5"}`}>
      <ImageFrame
        src={image?.src}
        alt={image?.alt ?? ""}
        placeholderLabel={ui.imagePending}
        className="aspect-37/45"
        sizes="(min-width: 1024px) 25vw, 50vw"
      />
      <Eyebrow small className={`${extra} ${inicio ? "" : "mt-1"}`}>
        {product.category}
      </Eyebrow>
      <div className="mt-1 flex flex-col gap-1.5 lg:mt-0 lg:flex-row lg:items-baseline lg:justify-between lg:gap-2">
        <Heading className="text-21 lg:text-26">{product.name}</Heading>
        <p className="shrink-0 text-15 font-semibold lg:text-16">{formatPrice(size.price)}</p>
      </div>
      <p className={`text-14 text-secundario ${extra}`}>{detail}</p>
      {action && <div className="flex flex-col pt-1.5">{action}</div>}
    </article>
  );
}
