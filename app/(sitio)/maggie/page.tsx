import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { MaggieHero } from "@/components/maggie/MaggieHero";
import { MaggieStory } from "@/components/maggie/MaggieStory";
import { pages } from "@/data/site";

const content = pages.maggie;

export const metadata: Metadata = content.metadata;

export default function MaggiePage() {
  const { cta } = content;

  return (
    <>
      <MaggieHero />
      <MaggieStory />

      <div className="contenedor pb-16 lg:pb-26">
        <section
          aria-labelledby="cta-titulo"
          data-surface="dark"
          className="flex flex-col gap-8 rounded-3xl bg-chocolate p-8 text-hueso lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:rounded-4xl lg:p-18"
        >
          <div className="flex flex-col gap-3.5">
            <h2 id="cta-titulo" className="text-30 text-hueso lg:text-44">
              {cta.title}
            </h2>
            <p className="text-17 text-crema-suave">{cta.text}</p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button href={cta.primary.href} variant="light" size="lg">
              {cta.primary.label}
            </Button>
            <Button href={cta.secondary.href} variant="outlineLight" size="lg">
              {cta.secondary.label}
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
