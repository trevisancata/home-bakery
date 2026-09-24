import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { Section } from "@/components/Section";
import { products, type ProductCategory } from "@/data/products";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Productos",
  description: "Tortas, budines, cookies y tartas caseras por encargo.",
};

const categories: ProductCategory[] = ["Tortas", "Budines", "Cookies", "Tartas"];

export default function ProductosPage() {
  return (
    <>
      <PageHeader eyebrow="Por encargo" title="Productos">
        <p>
          Todo se hornea el día anterior a la entrega. Hacé tu pedido con al menos 48 horas de
          anticipación. {site.contact.pickup}.
        </p>
      </PageHeader>

      {categories.map((category, index) => {
        const items = products.filter((product) => product.category === category);
        if (items.length === 0) return null;
        return (
          <Section
            key={category}
            id={category.toLowerCase()}
            title={category}
            tone={index % 2 === 0 ? "rosa" : "crema"}
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
