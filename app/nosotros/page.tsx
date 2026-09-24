import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Nosotros",
  description: `La historia de ${site.name} y de ${site.owner.name}, la pastelera detrás de cada receta.`,
};

const values = [
  {
    title: "Ingredientes de verdad",
    text: "Manteca, huevos de campo y frutas de estación. Sin premezclas ni conservantes.",
  },
  {
    title: "Tiempo y paciencia",
    text: "Cada pedido se hornea en pocas cantidades, para que salga como tiene que salir.",
  },
  {
    title: "Recetas compartidas",
    text: "Nada de secretos: en los workshops enseño las mismas recetas que vendo.",
  },
];

export default function NosotrosPage() {
  return (
    <>
      <PageHeader eyebrow="Nuestra historia" title={`Detrás de ${site.name}`}>
        <p>{site.tagline}</p>
      </PageHeader>

      <Section id="historia" title={`Hola, soy ${site.owner.name}`} tone="rosa">
        <div className="grid items-center gap-10 md:grid-cols-[2fr_3fr]">
          <Image
            src="/images/sofia.svg"
            alt={`${site.owner.name}, fundadora de ${site.name}, sonriendo en su cocina con un delantal y un bowl de masa`}
            width={600}
            height={750}
            sizes="(min-width: 768px) 40vw, 100vw"
            className="mx-auto w-full max-w-sm rounded-3xl"
          />
          <div className="space-y-4 text-lg">
            <p className="font-semibold">{site.owner.role}</p>
            {site.owner.bio.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </Section>

      <Section id="valores" title="Lo que nos importa">
        <ul className="grid gap-6 md:grid-cols-3">
          {values.map((value) => (
            <li key={value.title} className="rounded-2xl bg-white p-6 ring-1 ring-cacao/10">
              <h3 className="text-xl font-semibold">{value.title}</h3>
              <p className="mt-2 text-cacao-suave">{value.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="cocina" title="La cocina" tone="rosa">
        <figure>
          <Image
            src="/images/cocina.svg"
            alt="Cocina luminosa con una mesada de madera, frascos de harina y azúcar y un horno encendido"
            width={800}
            height={600}
            sizes="(min-width: 768px) 768px, 100vw"
            className="w-full max-w-3xl rounded-3xl"
          />
          <figcaption className="mt-3 text-cacao-suave">
            Todo se hornea en una cocina habilitada, en {site.city}.
          </figcaption>
        </figure>
        <Button href="/contacto" className="mt-10">
          Escribime
        </Button>
      </Section>
    </>
  );
}
