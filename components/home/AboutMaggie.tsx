import { Adaptive } from "@/components/Adaptive";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { ImageFrame } from "@/components/ImageFrame";
import { SectionTitle } from "@/components/SectionTitle";
import { pages, ui } from "@/data/site";

const { about } = pages.home;

export function AboutMaggie() {
  return (
    <section
      aria-labelledby="maggie-titulo"
      className="contenedor grid items-center gap-4.5 pb-12 lg:grid-cols-2 lg:gap-20 lg:pt-10 lg:pb-26"
    >
      <ImageFrame
        src={about.image.src}
        alt={about.image.alt}
        placeholderLabel={ui.imagePending}
        rounded="rounded-card-sm lg:rounded-3xl"
        sizes="(min-width: 1024px) 45vw, 100vw"
        className="h-95 lg:h-140"
      />
      <div className="flex flex-col gap-4.5 lg:gap-6">
        <Eyebrow>{about.eyebrow}</Eyebrow>
        <SectionTitle
          id="maggie-titulo"
          title={about.title}
          script={about.script}
          size="text-38 lg:text-56 lg:leading-titulo"
        />
        <p className="text-17 leading-parrafo lg:text-19">
          <Adaptive full={about.lead.full} short={about.lead.short} />
        </p>
        <p className="hidden text-16 leading-amplio text-secundario lg:block">{about.text}</p>
        <Button href={about.cta.href} variant="secondary" className="lg:self-start">
          {about.cta.label}
        </Button>
      </div>
    </section>
  );
}
