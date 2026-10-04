import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { ImageFrame } from "@/components/ImageFrame";
import { SectionTitle } from "@/components/SectionTitle";
import { pages } from "@/data/site";

const { about } = pages.home;

/** Presentación de Maggie con su foto y dos frases de su texto. */
export function AboutMaggie() {
  return (
    <section
      aria-labelledby="maggie-titulo"
      className="contenedor grid items-center gap-4.5 pb-12 lg:grid-cols-2 lg:gap-20 lg:pt-10 lg:pb-26"
    >
      <ImageFrame
        src={about.image.src}
        alt={about.image.alt}
        rounded="rounded-card-sm lg:rounded-3xl"
        sizes="(min-width: 1024px) 45vw, 100vw"
        objectPosition="object-[50%_30%]"
        className="h-110 lg:h-160"
      />
      <div className="flex flex-col gap-4.5 lg:gap-6">
        <Eyebrow>{about.eyebrow}</Eyebrow>
        <SectionTitle
          id="maggie-titulo"
          title={about.title}
          script={about.script}
          size="text-38 lg:text-56 lg:leading-titulo"
        />
        <p className="font-display text-20 leading-medio lg:text-24">{about.lead}</p>
        <p className="text-16 leading-amplio text-secundario lg:text-17">{about.text}</p>
        <Button href={about.cta.href} variant="secondary" className="lg:self-start">
          {about.cta.label}
        </Button>
      </div>
    </section>
  );
}
