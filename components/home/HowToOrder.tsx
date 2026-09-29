import { Adaptive } from "@/components/Adaptive";
import { Eyebrow } from "@/components/Eyebrow";
import { SectionTitle } from "@/components/SectionTitle";
import { pages } from "@/data/site";

const { howToOrder } = pages.home;

/** Los cuatro pasos para pedir: tarjetas horizontales en mobile, columnas en desktop. */
export function HowToOrder() {
  return (
    <section id="como-pedir" aria-labelledby="como-pedir-titulo" className="bg-arena">
      <div className="contenedor flex flex-col gap-5 py-12 lg:gap-12 lg:py-22">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-5 lg:gap-3">
            <Eyebrow>{howToOrder.eyebrow}</Eyebrow>
            <SectionTitle id="como-pedir-titulo" title={howToOrder.title} />
          </div>
          <p className="hidden max-w-95 text-16 leading-parrafo text-secundario lg:block">{howToOrder.intro}</p>
        </div>

        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {howToOrder.steps.map((step, index) => (
            <li
              key={step.title.full}
              className="flex gap-4 rounded-card bg-hueso p-5 lg:flex-col lg:gap-3.5 lg:rounded-3xl lg:p-8"
            >
              <span aria-hidden="true" className="font-display text-32 leading-none text-chocolate lg:text-44 lg:leading-natural">
                {index + 1}
              </span>
              <div className="flex flex-col gap-1 lg:gap-3.5">
                <h3 className="font-sans text-16 font-bold lg:font-display lg:text-26 lg:font-normal">
                  <Adaptive full={step.title.full} short={step.title.short} />
                </h3>
                <p className="text-15 leading-normal text-secundario lg:text-16 lg:leading-parrafo">
                  <Adaptive
                    full={step.text.full.map((line, lineIndex) => (
                      <span key={line}>
                        {lineIndex > 0 && <br />}
                        {line}
                      </span>
                    ))}
                    short={step.text.short}
                  />
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
