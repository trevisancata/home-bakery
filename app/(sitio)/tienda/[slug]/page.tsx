import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { ImageFrame } from "@/components/ImageFrame";
import { pages, ui, whatsappLink, whatsappMessages } from "@/data/site";
import { getProduct, getProducts } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { seasonRange } from "@/lib/temporada";

type Props = { params: Promise<{ slug: string }> };

const content = pages.tienda;
const { product: text } = content;

// ISR cada 5 minutos. TODO(E5): revalidación on-demand.
export const revalidate = 300;

/** Se prerenderizan los productos activos; los nuevos se generan al primer pedido. */
export async function generateStaticParams() {
  return (await getProducts()).map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const [cover] = product.images;
  return {
    title: product.name,
    description: product.description ?? content.metadata.description,
    openGraph: cover ? { images: [{ url: cover.src, width: cover.width, height: cover.height, alt: cover.alt }] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [cover, ...rest] = product.images;
  const range = product.season ? seasonRange(product.season) : null;
  const details = [
    { term: text.details.measure, value: product.measure },
    { term: text.details.servings, value: product.servings },
    { term: text.details.weight, value: product.weight },
    { term: text.details.presentation, value: product.presentation },
    { term: text.details.season, value: range && text.season(range) },
    { term: text.details.leadTime, value: text.leadTime(product.leadTimeHours) },
  ].filter((detail) => detail.value);

  return (
    <div className="contenedor flex flex-col gap-8 pt-7 pb-16 lg:pt-14 lg:pb-26">
      <nav aria-label={text.breadcrumb.label}>
        <ol className="flex flex-wrap gap-1 text-14 text-secundario">
          <li>
            <Link href={text.breadcrumb.parent.href} className="text-secundario underline hover:text-carbon">
              {text.breadcrumb.parent.label}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/tienda?categoria=${product.category.slug}`}
              className="text-secundario underline hover:text-carbon"
            >
              {product.category.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-16">
        <section aria-label={text.gallery} className="flex flex-col gap-3 lg:gap-4">
          {cover ? (
            <div className="relative aspect-4/5 overflow-hidden rounded-card-sm bg-placeholder lg:rounded-3xl">
              <Image
                src={cover.src}
                alt={cover.alt}
                fill
                preload
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <ImageFrame alt="" placeholderLabel={ui.imagePending} sizes="100vw" className="aspect-4/5" />
          )}
          {rest.length > 0 && (
            <ul className="grid grid-cols-3 gap-3 lg:gap-4">
              {rest.map((image) => (
                <li key={image.src} className="relative aspect-4/5 overflow-hidden rounded-card-sm bg-placeholder">
                  <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 15vw, 33vw" className="object-cover" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Eyebrow>{product.category.name}</Eyebrow>
            <h1 className="text-44 leading-titulo lg:text-56">{product.name}</h1>
            {product.description && <p className="text-17 leading-parrafo lg:text-18">{product.description}</p>}
          </div>

          <section aria-labelledby="tamanos-titulo" className="flex flex-col gap-2">
            <h2 id="tamanos-titulo" className="font-label text-14 tracking-eyebrow text-chocolate uppercase">
              {text.sizes}
            </h2>
            <ul className="flex flex-col divide-y divide-borde border-y border-borde">
              {product.sizes.map((size) => (
                <li key={size.label} className="flex justify-between gap-4 py-3 text-16">
                  <span>{size.label}</span>
                  <span className={`shrink-0 font-semibold ${size.price === null ? "text-secundario" : ""}`}>
                    {size.price === null ? ui.priceTbd : formatPrice(size.price)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {details.length > 0 && (
            <dl className="grid gap-x-6 gap-y-3 rounded-card bg-arena p-5 text-15 sm:grid-cols-2 lg:p-6">
              {details.map((detail) => (
                <div key={detail.term} className="flex flex-col gap-0.5">
                  <dt className="font-bold">{detail.term}</dt>
                  <dd>{detail.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {[
            { title: text.flavors, items: product.flavors },
            { title: text.decorations, items: product.decorations },
          ]
            .filter((list) => list.items.length > 0)
            .map((list) => (
              <section key={list.title} className="flex flex-col gap-2">
                <h2 className="font-label text-14 tracking-eyebrow text-chocolate uppercase">{list.title}</h2>
                <ul className="list-disc pl-5 text-16 leading-parrafo">
                  {list.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}

          <div className="flex flex-col gap-3">
            {product.custom ? (
              <Button
                href={whatsappLink(whatsappMessages.customProduct(product.name))}
                size="lg"
                className="sm:self-start"
              >
                {text.customCta}
              </Button>
            ) : !product.inSeason && range ? (
              <>
                <p className="font-semibold text-chocolate">{text.outOfSeason(range)}</p>
                <Button variant="secondary" size="lg" disabled className="sm:self-start">
                  {content.card.outOfSeason}
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="lg" disabled className="sm:self-start">
                {content.card.soon}
              </Button>
            )}
            <Link href="/tienda" className="self-start py-2.5 font-semibold text-chocolate underline hover:text-carbon">
              {text.back}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
