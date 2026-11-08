import { Button } from "@/components/Button";
import { ImageFrame } from "@/components/ImageFrame";
import { SectionTitle } from "@/components/SectionTitle";
import { pages } from "@/data/site";
import type { PastWorkshop } from "@/lib/data";

const { past, custom } = pages.workshops;

/**
 * "Así fueron los workshops" (los que ya pasaron y tienen foto de cómo fue,
 * desde la base) y el recuadro de workshop personalizado. En mobile, los
 * workshops van en una fila con scroll horizontal; desde sm, en una grilla de
 * 3 columnas. Sin ninguno, quedan solo el link a Instagram y el recuadro.
 */
export function PastWorkshops({ workshops }: { workshops: PastWorkshop[] }) {
  const instagram = (
    <a
      href={past.instagram.href}
      className="self-start py-2.5 font-semibold text-chocolate underline hover:text-carbon lg:self-auto lg:py-0"
    >
      {past.instagram.label} <span aria-hidden="true" className="font-simbolos">→</span>
    </a>
  );

  if (workshops.length === 0) {
    return (
      <div className="flex flex-col gap-6 lg:gap-8">
        {instagram}
        {/* Sin el título de la sección, el recuadro queda como h2. */}
        <Custom heading="h2" />
      </div>
    );
  }

  return (
    <section aria-labelledby="pasados-titulo" className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <SectionTitle id="pasados-titulo" title={past.title} script={past.script} size="text-34 lg:text-40" />
        {instagram}
      </div>

      {/* Se puede enfocar para mover el scroll con el teclado en mobile. */}
      <div
        role="region"
        aria-label={past.listLabel}
        tabIndex={0}
        className="-mx-4 snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:snap-none sm:overflow-visible sm:px-0 sm:pb-0"
      >
        <ul className="flex gap-3 sm:grid sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 lg:gap-x-8 lg:gap-y-10">
          {workshops.map((item) => (
            <li key={item.image.src} className="flex w-[72%] shrink-0 snap-start flex-col gap-3 sm:w-auto">
              <ImageFrame
                src={item.image.src}
                alt={item.image.alt}
                sizes="(min-width: 640px) 33vw, 72vw"
                className="aspect-4/3 lg:aspect-3/2"
              />
              <div className="flex flex-col gap-1">
                <h3 className="text-21 lg:text-24">{item.name}</h3>
                <p className="text-15 text-secundario">{item.date}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Custom />
    </section>
  );
}

function Custom({ heading: Heading = "h3" }: { heading?: "h2" | "h3" }) {
  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-borde p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-12 lg:py-10">
      <div className="flex flex-col gap-2">
        <Heading className="text-26 lg:text-30">{custom.title}</Heading>
        <p className="text-16 leading-parrafo text-secundario">{custom.text}</p>
      </div>
      <Button href={custom.cta.href} size="lg" className="shrink-0">
        {custom.cta.label}
      </Button>
    </div>
  );
}
