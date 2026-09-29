import { Adaptive } from "@/components/Adaptive";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { ImageFrame } from "@/components/ImageFrame";
import { SectionTitle } from "@/components/SectionTitle";
import { pages, ui } from "@/data/site";
import type { Workshop } from "@/lib/data";
import { formatDay, formatTime } from "@/lib/format";

const { hero } = pages.home;

/**
 * Portada. La foto va arriba en mobile y a la derecha en desktop: se
 * renderiza dos veces (una oculta con display: none) para que el orden
 * del DOM coincida con el visual en los dos casos.
 */
export function Hero({ nextWorkshop }: { nextWorkshop?: Workshop }) {
  return (
    <section
      aria-labelledby="hero-titulo"
      className="contenedor grid items-center gap-5 pt-7 pb-12 lg:grid-cols-2 lg:gap-16 lg:pt-18 lg:pb-24"
    >
      <ImageFrame
        src={hero.image.src}
        alt={hero.image.alt}
        placeholderLabel={ui.imagePending}
        rounded="rounded-t-arco-sm rounded-b-card"
        preload
        sizes="100vw"
        className="h-90 lg:hidden"
      />

      <div className="flex flex-col gap-5 lg:gap-7">
        <Eyebrow>{hero.eyebrow}</Eyebrow>
        <SectionTitle as="h1" id="hero-titulo" title={hero.title} script={hero.script} />
        <p className="text-17 leading-parrafo text-secundario lg:max-w-120 lg:text-19">
          <Adaptive full={hero.text.full} short={hero.text.short} />
        </p>
        <div className="flex flex-col gap-3 md:flex-row lg:mt-2 lg:gap-4">
          <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
          <Button href={hero.secondaryCta.href} variant="secondary">
            {hero.secondaryCta.label}
          </Button>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <ImageFrame
          src={hero.image.src}
          alt={hero.image.alt}
          placeholderLabel={ui.imagePending}
          rounded="rounded-t-arco rounded-b-3xl"
          preload
          sizes="(min-width: 1440px) 520px, 45vw"
          className="ml-auto aspect-26/31 w-full max-w-130"
        />
        {nextWorkshop && (
          <div className="absolute bottom-12 left-0 flex w-76 flex-col gap-2 rounded-card bg-white p-5.5 shadow-tarjeta">
            <Eyebrow>{hero.nextWorkshop.eyebrow}</Eyebrow>
            <p className="font-display text-22">{nextWorkshop.name}</p>
            <p className="text-14 text-secundario">
              <time dateTime={nextWorkshop.startsAt}>
                {formatDay(nextWorkshop.startsAt)} · {formatTime(nextWorkshop.startsAt)}
              </time>
            </p>
            <p className="text-14 font-semibold text-chocolate">{hero.nextWorkshop.spotsLeft(nextWorkshop.spotsLeft)}</p>
          </div>
        )}
      </div>
    </section>
  );
}
