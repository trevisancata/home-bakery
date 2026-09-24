import Image from "next/image";
import { Button } from "@/components/Button";
import { ProductCard } from "@/components/ProductCard";
import { Section } from "@/components/Section";
import { WorkshopCard } from "@/components/WorkshopCard";
import { featuredProducts } from "@/data/products";
import { site } from "@/data/site";
import { upcomingWorkshops } from "@/data/workshops";

export default function Home() {
  return (
    <>
      <section aria-labelledby="hero-titulo" className="px-4 pt-10 pb-16 sm:px-6 lg:pt-16 lg:pb-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-bold tracking-widest text-terracota uppercase">
              Pastelería casera en {site.city}
            </p>
            <h1 id="hero-titulo" className="text-4xl leading-tight font-semibold sm:text-5xl lg:text-6xl">
              Tortas, budines y cookies hechos en casa, como antes.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-cacao-suave">{site.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/productos">Ver productos</Button>
              <Button href="/workshops" variant="outline">
                Próximos workshops
              </Button>
            </div>
          </div>
          <Image
            src="/images/hero.svg"
            alt="Mesa de madera con una torta de chocolate, un budín de limón y cookies recién horneadas"
            width={800}
            height={600}
            preload
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="w-full rounded-3xl"
          />
        </div>
      </section>

      <Section
        id="destacados"
        eyebrow="Lo más pedido"
        title="Productos destacados"
        intro="Recetas propias, horneadas por encargo con ingredientes frescos."
        tone="rosa"
      >
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <Button href="/productos" variant="outline">
            Ver todos los productos
          </Button>
        </div>
      </Section>

      <Section
        id="workshops"
        eyebrow="Aprendé a hornear"
        title="Próximos workshops"
        intro="Grupos reducidos, todo el material incluido y te llevás lo que horneás."
      >
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingWorkshops.map((workshop) => (
            <li key={workshop.id}>
              <WorkshopCard workshop={workshop} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sobre-ella" eyebrow="Detrás del horno" title={`Hola, soy ${site.owner.name}`} tone="rosa">
        <div className="grid items-center gap-10 md:grid-cols-[2fr_3fr]">
          <Image
            src="/images/sofia.svg"
            alt={`${site.owner.name}, fundadora de ${site.name}, sonriendo en su cocina con un delantal y un bowl de masa`}
            width={600}
            height={750}
            sizes="(min-width: 768px) 40vw, 100vw"
            className="mx-auto w-full max-w-sm rounded-3xl"
          />
          <div className="space-y-4 text-lg">
            <p>{site.owner.bio[0]}</p>
            <p>{site.owner.bio[1]}</p>
            <Button href="/nosotros" variant="outline" className="mt-2">
              Conocé la historia
            </Button>
          </div>
        </div>
      </Section>

      <section aria-labelledby="cta-titulo" className="px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-4xl rounded-3xl bg-cacao px-6 py-12 text-center text-crema sm:px-12">
          <h2 id="cta-titulo" className="text-3xl font-semibold text-crema sm:text-4xl">
            ¿Tenés un cumple, una reunión o simplemente ganas de algo rico?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg">
            Escribime con al menos 48 horas de anticipación y armamos tu pedido.
          </p>
          <Button href="/contacto" variant="secondary" className="mt-8">
            Hacer un pedido
          </Button>
        </div>
      </section>
    </>
  );
}
