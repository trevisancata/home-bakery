import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { Section } from "@/components/Section";
import { pages } from "@/data/site";
import { getProductCategories, getProducts } from "@/lib/data";

const content = pages.tienda;

export const metadata: Metadata = content.metadata;

export default async function TiendaPage() {
  const [productCategories, products] = await Promise.all([getProductCategories(), getProducts()]);

  return (
    <>
      <PageHeader eyebrow={content.eyebrow} title={content.title} script={content.script}>
        <p>{content.intro}</p>
      </PageHeader>

      {productCategories.map((category, index) => {
        const items = products.filter((product) => product.category === category);
        if (items.length === 0) return null;
        return (
          <Section
            key={category}
            id={category.toLowerCase()}
            title={category}
            tone={index % 2 === 0 ? "arena" : "hueso"}
            className="lg:py-16"
          >
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          </Section>
        );
      })}
    </>
  );
}
