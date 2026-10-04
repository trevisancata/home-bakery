import { Button } from "@/components/Button";
import { SectionTitle } from "@/components/SectionTitle";
import { pages } from "@/data/site";

const { past, custom } = pages.workshops;

/**
 * "Así fueron los workshops" y el recuadro de workshop personalizado.
 * Mientras Maggie no mande nombre, fecha y foto de los workshops pasados,
 * solo va el título con el link a Instagram (no se inventan nombres).
 */
export function PastWorkshops() {
  return (
    <section aria-labelledby="pasados-titulo" className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <SectionTitle id="pasados-titulo" title={past.title} script={past.script} size="text-34 lg:text-40" />
        <a
          href={past.instagram.href}
          className="self-start py-2.5 font-semibold text-chocolate underline hover:text-carbon lg:self-auto lg:py-0"
        >
          {past.instagram.label} <span aria-hidden="true" className="font-simbolos">→</span>
        </a>
      </div>

      <div className="flex flex-col gap-6 rounded-3xl border border-borde p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-12 lg:py-10">
        <div className="flex flex-col gap-2">
          <h3 className="text-26 lg:text-30">{custom.title}</h3>
          <p className="text-16 leading-parrafo text-secundario">{custom.text}</p>
        </div>
        <Button href={custom.cta.href} size="lg" className="shrink-0">
          {custom.cta.label}
        </Button>
      </div>
    </section>
  );
}
