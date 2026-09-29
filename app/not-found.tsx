import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { SectionTitle } from "@/components/SectionTitle";
import { pages } from "@/data/site";

const content = pages.notFound;

export const metadata: Metadata = content.metadata;

/** Página 404: se muestra dentro del layout, con header y footer. */
export default function NotFound() {
  return (
    <div className="contenedor flex flex-col items-center gap-5 py-20 text-center lg:gap-7 lg:py-32">
      <Eyebrow>{content.eyebrow}</Eyebrow>
      <SectionTitle as="h1" title={content.title} script={content.script} className="max-w-3xl" />
      <p className="max-w-115 text-17 leading-parrafo text-secundario lg:text-18">{content.text}</p>
      <Button href={content.cta.href} size="lg" className="mt-2">
        {content.cta.label}
      </Button>
    </div>
  );
}
