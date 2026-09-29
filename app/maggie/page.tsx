import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { ImageFrame } from "@/components/ImageFrame";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { pages, site, ui } from "@/data/site";

const content = pages.maggie;

export const metadata: Metadata = content.metadata;

export default function MaggiePage() {
  return (
    <>
      <PageHeader eyebrow={content.eyebrow} title={content.title} script={content.script}>
        <p>{content.intro}</p>
      </PageHeader>

      <Section id="historia" title={content.story.title} script={content.story.script} tone="arena">
        <div className="grid items-center gap-10 md:grid-cols-[2fr_3fr] lg:gap-16">
          <ImageFrame
            src={content.story.image.src}
            alt={content.story.image.alt}
            placeholderLabel={ui.imagePending}
            ratio="4/5"
            sizes="(min-width: 768px) 40vw, 100vw"
            className="mx-auto w-full max-w-sm"
          />
          <div className="space-y-4 text-lg">
            <p className="font-label text-sm tracking-[0.2em] text-chocolate uppercase">
              {site.owner.role}
            </p>
            {site.owner.bio.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </Section>

      <Section id="valores" title={content.values.title}>
        <ul className="grid gap-6 md:grid-cols-3">
          {content.values.items.map((value) => (
            <li key={value.title} className="rounded-4xl bg-arena p-6 lg:p-8">
              <h3 className="text-2xl">{value.title}</h3>
              <p className="mt-2 text-secundario">{value.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="cocina" title={content.kitchen.title} tone="arena">
        <figure>
          <ImageFrame
            src={content.kitchen.image.src}
            alt={content.kitchen.image.alt}
            placeholderLabel={ui.imagePending}
            ratio="3/2"
            sizes="(min-width: 768px) 768px, 100vw"
            className="w-full max-w-3xl"
          />
          <figcaption className="mt-3 text-secundario">{content.kitchen.caption}</figcaption>
        </figure>
        <Button href={content.kitchen.cta.href} className="mt-10">
          {content.kitchen.cta.label}
        </Button>
      </Section>
    </>
  );
}
