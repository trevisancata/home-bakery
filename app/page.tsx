import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { ImageFrame } from "@/components/ImageFrame";
import { ProductCard } from "@/components/ProductCard";
import { Section } from "@/components/Section";
import { SectionTitle } from "@/components/SectionTitle";
import { WorkshopCard } from "@/components/WorkshopCard";
import { pages, site, ui } from "@/data/site";
import { getFeaturedProducts, getWorkshops } from "@/lib/data";

const { hero, featured, workshops, about, order } = pages.home;

export default async function Home() {
  const [featuredProducts, upcomingWorkshops] = await Promise.all([getFeaturedProducts(), getWorkshops()]);

  return (
    <>
      <section aria-labelledby="hero-titulo" className="pt-10 pb-16 lg:pt-18 lg:pb-24">
        <div className="contenedor grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow className="mb-4">{hero.eyebrow}</Eyebrow>
            <SectionTitle as="h1" id="hero-titulo" title={hero.title} script={hero.script} />
            <p className="mt-6 max-w-xl text-lg text-secundario">{hero.text}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
              <Button href={hero.secondaryCta.href} variant="secondary">
                {hero.secondaryCta.label}
              </Button>
            </div>
          </div>
          <ImageFrame
            src={hero.image.src}
            alt={hero.image.alt}
            placeholderLabel={ui.imagePending}
            ratio="4/5"
            preload
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="mx-auto w-full max-w-md lg:max-w-none"
          />
        </div>
      </section>

      <Section
        id="destacados"
        eyebrow={featured.eyebrow}
        title={featured.title}
        script={featured.script}
        intro={featured.intro}
        tone="arena"
        align="center"
      >
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
        <div className="mt-12 text-center">
          <Button href={featured.cta.href} variant="secondary">
            {featured.cta.label}
          </Button>
        </div>
      </Section>

      <Section
        id="workshops"
        eyebrow={workshops.eyebrow}
        title={workshops.title}
        script={workshops.script}
        intro={workshops.intro}
        align="center"
      >
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingWorkshops.map((workshop) => (
            <li key={workshop.id}>
              <WorkshopCard workshop={workshop} />
            </li>
          ))}
        </ul>
        <div className="mt-12 text-center">
          <Button href={workshops.cta.href} variant="secondary">
            {workshops.cta.label}
          </Button>
        </div>
      </Section>

      <Section
        id="sobre-maggie"
        eyebrow={about.eyebrow}
        title={about.title}
        script={about.script}
        tone="arena"
      >
        <div className="grid items-center gap-10 md:grid-cols-5 lg:gap-16">
          <ImageFrame
            src={about.image.src}
            alt={about.image.alt}
            placeholderLabel={ui.imagePending}
            ratio="4/5"
            sizes="(min-width: 768px) 40vw, 100vw"
            className="mx-auto w-full max-w-sm md:col-span-2"
          />
          <div className="space-y-4 text-lg md:col-span-3">
            {site.owner.bio.slice(0, 2).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <Button href={about.cta.href} className="mt-4">
              {about.cta.label}
            </Button>
          </div>
        </div>
      </Section>

      <section aria-labelledby="pedido-titulo" className="px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-4xl rounded-4xl border border-greige bg-arena px-6 py-12 text-center sm:px-12 lg:py-16">
          <Eyebrow className="mb-4">{order.eyebrow}</Eyebrow>
          <SectionTitle id="pedido-titulo" title={order.title} script={order.script} />
          <p className="mx-auto mt-5 max-w-2xl text-lg text-secundario">{order.text}</p>
          <Button href={order.cta.href} className="mt-8">
            {order.cta.label}
          </Button>
        </div>
      </section>
    </>
  );
}
