import { Eyebrow } from "@/components/Eyebrow";
import { pages } from "@/data/site";

const { steps } = pages.workshops;

/** "Cómo es un workshop": datos clave y los 4 pasos, con palabras de Maggie. */
export function WorkshopSteps() {
  return (
    <section aria-labelledby="como-es-titulo" className="bg-arena">
      <div className="contenedor flex flex-col gap-8 py-14 lg:gap-12 lg:py-24">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div className="flex flex-col gap-3">
            <Eyebrow>{steps.eyebrow}</Eyebrow>
            <h2 id="como-es-titulo" className="text-34 lg:text-48">
              {steps.title}
            </h2>
          </div>
          <ul className="flex max-w-160 flex-wrap gap-2.5 lg:justify-end">
            {steps.facts.map((fact) => (
              <li key={fact} className="rounded-full bg-hueso px-4.5 py-2.5 text-14 font-medium lg:text-15">
                {fact}
              </li>
            ))}
          </ul>
        </div>
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {steps.items.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3 rounded-3xl bg-hueso p-6 lg:p-8">
              <span aria-hidden="true" className="font-display text-36 leading-none text-chocolate lg:text-44">
                {index + 1}
              </span>
              <h3 className="text-22 lg:text-26">{step.title}</h3>
              <p className="text-15 leading-parrafo text-secundario lg:text-16">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
