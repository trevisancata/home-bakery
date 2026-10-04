import { BackgroundVideo } from "@/components/BackgroundVideo";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { SectionTitle } from "@/components/SectionTitle";
import { pages } from "@/data/site";

const { hero } = pages.workshops;

/**
 * Portada de /workshops a todo el ancho, con video de la dinámica de cocina
 * de fondo. Lleva la misma capa y degradé que el carrusel del inicio para
 * que el texto llegue a AA sobre cualquier video.
 */
export function WorkshopsHero() {
  return (
    <section
      data-surface="dark"
      aria-label={hero.label}
      className="relative h-160 overflow-hidden bg-chocolate-claro"
    >
      <BackgroundVideo
        src={hero.video.src}
        poster={hero.video.poster}
        className="absolute inset-0"
        placeholderClassName="items-start justify-end p-4 lg:px-10 lg:py-7"
        buttonClassName="right-4 bottom-4 lg:right-20 lg:bottom-20"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-capa/45" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-capa/60 via-capa/55 via-60% to-transparent lg:bg-linear-to-r lg:from-capa/65 lg:via-capa/60 lg:via-50% lg:to-transparent lg:to-85%"
      />

      <div className="contenedor pointer-events-none relative flex h-full flex-col justify-end pb-20 lg:pb-20">
        <div className="pointer-events-auto flex max-w-190 flex-col gap-4 lg:gap-5.5">
          <Eyebrow tone="crema">{hero.eyebrow}</Eyebrow>
          <SectionTitle
            as="h1"
            title={hero.title}
            script={hero.script}
            size="text-48 leading-hero tracking-titulo text-hueso lg:text-84 lg:leading-none"
            className="mb-1 lg:mb-4"
          />
          <p className="max-w-145 text-16 leading-medio text-hueso lg:text-20 lg:leading-parrafo">{hero.text}</p>
          <Button href={hero.cta.href} variant="light" size="lg" className="mt-1 self-start">
            {hero.cta.label}
          </Button>
        </div>
      </div>
    </section>
  );
}
