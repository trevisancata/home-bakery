import { Eyebrow } from "@/components/Eyebrow";
import { ImageFrame } from "@/components/ImageFrame";
import { SectionTitle } from "@/components/SectionTitle";
import { pages, ui } from "@/data/site";

const { hero } = pages.maggie;

/** Presentación de Maggie: texto a la izquierda y retrato con foto de detalle superpuesta. */
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
        />
        <p className="font-display text-19 leading-medio lg:text-22">{hero.lead}</p>
        <p className="text-16 leading-amplio text-secundario lg:text-17">{hero.text}</p>
      </div>

      <div className="relative h-108 lg:h-180">
        {/* Sin etiqueta de foto pendiente: la foto de detalle le tapa la esquina. */}
        <div className="absolute top-0 right-0 h-96 w-4/5 lg:h-160 lg:w-125">
          <ImageFrame
            src={hero.portrait.src}
            alt={hero.portrait.alt}
            rounded="rounded-t-arco-retrato rounded-b-card-sm lg:rounded-b-3xl"
            sizes="(min-width: 1024px) 500px, 80vw"
            preload
            className="h-full"
          />
        </div>
        <div className="absolute bottom-0 left-0 h-44 w-36 lg:h-70 lg:w-60">
          <ImageFrame
            src={hero.detail.src}
            alt={hero.detail.alt}
            placeholderLabel={ui.imagePending}
            rounded="rounded-card-sm lg:rounded-3xl"
            sizes="(min-width: 1024px) 240px, 144px"
            className="h-full border-4 border-hueso lg:border-8"
          />
        </div>
      </div>
    </section>
  );
}
