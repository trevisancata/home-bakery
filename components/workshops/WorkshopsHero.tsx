import { BackgroundVideo } from "@/components/BackgroundVideo";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { SectionTitle } from "@/components/SectionTitle";
import { pages } from "@/data/site";

const { hero } = pages.workshops;

/**
 * Portada de /workshops con el reel de los workshops. Es un solo <video>
 * para los dos tamaños, así no se descarga dos veces:
 * - Mobile: de fondo a todo el ancho, con la misma capa y degradé que el
 *   carrusel del inicio para que el texto llegue a AA sobre cualquier cuadro.
 * - Desktop: el reel es vertical y de baja resolución, así que no se estira:
 *   va enmarcado al lado del texto, sobre el fondo chocolate.
 */
export function WorkshopsHero() {
  return (
    <section
      data-surface="dark"
      aria-label={hero.label}
      className="relative h-160 overflow-hidden bg-chocolate-claro lg:h-auto"
    >
      <div className="contenedor flex h-full flex-col justify-end pb-20 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16 lg:py-16">
        <BackgroundVideo
          src={hero.video.src}
          poster={hero.video.poster}
          posterPreload
          posterSizes="(min-width: 1024px) 315px, 100vw"
          className="absolute inset-0 lg:relative lg:inset-auto lg:order-last lg:aspect-9/16 lg:h-140 lg:overflow-hidden lg:rounded-3xl"
          placeholderClassName="items-start justify-end p-4 lg:p-6"
          buttonClassName="right-4 bottom-4 lg:right-5 lg:bottom-5"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-capa/45 lg:hidden" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-capa/60 via-capa/55 via-60% to-transparent lg:hidden"
        />

        <div className="relative flex max-w-190 flex-col gap-4 lg:gap-5.5">
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
