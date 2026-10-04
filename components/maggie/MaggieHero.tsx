import { Eyebrow } from "@/components/Eyebrow";
import { ImageFrame } from "@/components/ImageFrame";
import { SectionTitle } from "@/components/SectionTitle";
import { pages } from "@/data/site";

const { hero } = pages.maggie;

/** Presentación de Maggie: texto a la izquierda y su foto en arco a la derecha. */
export function MaggieHero() {
  return (
    <section className="contenedor grid items-center gap-10 pt-10 pb-16 lg:grid-cols-2 lg:gap-20 lg:pt-20 lg:pb-26">
      <div className="flex flex-col gap-5 lg:gap-7">
        <Eyebrow>{hero.eyebrow}</Eyebrow>
        <SectionTitle
          as="h1"
          title={hero.title}
          script={hero.script}
          size="text-44 leading-titulo tracking-titulo lg:text-76 lg:leading-portada xl:text-96"
          // Margen para que el trazo bajo de la manuscrita no pise el texto.
          className="mb-2 lg:mb-6"
        />
        <p className="font-display text-20 leading-medio lg:text-26">{hero.lead}</p>
      </div>

      <ImageFrame
        src={hero.portrait.src}
        alt={hero.portrait.alt}
        rounded="rounded-t-arco-sm rounded-b-card-sm lg:rounded-t-arco-retrato lg:rounded-b-3xl"
        sizes="(min-width: 1024px) 520px, 100vw"
        objectPosition="object-[50%_25%]"
        preload
        className="h-110 w-full lg:h-170 lg:w-130 lg:justify-self-end"
      />
    </section>
  );
}
