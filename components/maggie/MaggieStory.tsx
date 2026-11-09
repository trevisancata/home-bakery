import { DeferredImageFrame } from "@/components/DeferredImageFrame";
import { Eyebrow } from "@/components/Eyebrow";
import { SectionTitle } from "@/components/SectionTitle";
import { pages } from "@/data/site";

const { story, gallery } = pages.maggie;

/** "Mi historia" con el texto completo de Maggie en tres partes, y tres fotos de Maggie. */
export function MaggieStory() {
  return (
    <>
      <section aria-labelledby="historia-titulo" className="bg-arena">
        <div className="contenedor grid gap-8 py-16 lg:grid-cols-faq lg:gap-20 lg:py-26">
          <div className="flex flex-col gap-3">
            <Eyebrow>{story.eyebrow}</Eyebrow>
            <SectionTitle id="historia-titulo" title={story.title} script={story.script} size="text-34 lg:text-48" />
          </div>
          <div className="flex flex-col gap-8 lg:gap-10">
            {story.parts.map((part, index) => (
              <div
                key={part.title}
                className={`flex flex-col gap-4 ${index > 0 ? "border-t border-hueso-suave pt-8" : ""}`}
              >
                <h3 className="text-20 text-chocolate italic lg:text-22">{part.title}</h3>
                {part.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-17 leading-amplio lg:text-18">
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
            <p className="mt-2 text-30 leading-none lg:mt-4">
              <span className="manuscrita">{story.closing}</span>
            </p>
          </div>
        </div>
      </section>

      <div className="contenedor py-16 lg:py-26">
        {/* Mobile: scroll horizontal; se puede enfocar para moverlo con el teclado. Desde md: tres columnas. */}
        <div
          role="region"
          aria-label={gallery.label}
          tabIndex={0}
          className="-mx-4 snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:snap-none md:overflow-visible md:px-0"
        >
          <ul className="flex gap-3 md:grid md:grid-cols-3 lg:gap-6">
            {gallery.images.map((image) => (
              <li key={image.src} className="w-4/5 shrink-0 snap-start md:w-auto">
                {/* Después del load: no compiten con el retrato de la portada (LCP). */}
                <DeferredImageFrame
                  src={image.src}
                  alt={image.alt}
                  rounded="rounded-card-sm lg:rounded-3xl"
                  sizes="(min-width: 768px) 33vw, 80vw"
                  className="h-100 lg:h-125"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
