import { pages } from "@/data/site";

const { faq } = pages.workshops;

/** Preguntas frecuentes con las respuestas de Maggie, en <details> nativos: la primera arranca abierta. */
export function WorkshopsFaq() {
  return (
    <section id="preguntas-frecuentes" aria-labelledby="faq-titulo" className="grid gap-4 lg:grid-cols-faq lg:gap-16">
      <h2 id="faq-titulo" className="text-34 lg:text-40">
        {faq.title}
      </h2>
      <div>
        {faq.items.map((item, index) => (
          <details key={item.question} open={index === 0} className="border-b border-borde py-5.5">
            <summary className="cursor-pointer text-17 font-medium lg:text-19">{item.question}</summary>
            <p className="mt-3 leading-parrafo text-secundario">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
