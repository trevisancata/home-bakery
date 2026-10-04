import { ImageFrame } from "@/components/ImageFrame";
import { Eyebrow } from "@/components/Eyebrow";
import { SectionTitle } from "@/components/SectionTitle";
import { pages, ui } from "@/data/site";

const { story, gallery } = pages.maggie;

/** "Mi historia" con el texto completo de Maggie en tres partes, y galería de fotos. */
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

      <ul className="contenedor grid gap-3 py-16 md:grid-cols-3 lg:gap-6 lg:py-26">
        {gallery.map((image) => (
          <li key={image.alt}>
            <ImageFrame
              src={image.src}
              alt={image.alt}
              placeholderLabel={ui.imagePending}
              rounded="rounded-card-sm lg:rounded-3xl"
              sizes="(min-width: 768px) 33vw, 100vw"
              className="h-60 lg:h-105"
            />
          </li>
        ))}
      </ul>
    </>
  );
}
