import { ui, whatsappLink, whatsappMessages } from "@/data/site";
import type { Product } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { Button } from "./Button";
import { ImageFrame } from "./ImageFrame";

export function ProductCard({ product }: { product: Product }) {
  const [image] = product.images;
  const [size] = product.sizes;

  return (
    <article className="flex h-full flex-col rounded-4xl bg-hueso p-3 ring-1 ring-greige">
      <ImageFrame
        src={image?.src}
        alt={image?.alt ?? ""}
        placeholderLabel={ui.imagePending}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      />
      <div className="flex flex-1 flex-col gap-3 px-3 pt-5 pb-3">
        <p className="font-label text-xs tracking-eyebrow text-chocolate uppercase">
          {product.category}
        </p>
        <h3 className="text-2xl">{product.name}</h3>
        <p className="text-secundario">{product.description}</p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-3">
          <p>
            <span className="block text-xl font-medium">{formatPrice(size.price)}</span>
            <span className="text-sm text-secundario">{size.label}</span>
          </p>
          <Button href={whatsappLink(whatsappMessages.product(product.name))} variant="secondary">
            {ui.product.order}
            <span className="sr-only"> {product.name}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
