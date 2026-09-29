import { ImageFrame } from "@/components/ImageFrame";
import { pages, ui } from "@/data/site";

const { values, timeline, gallery } = pages.maggie;

/** Valores de la marca, línea de tiempo y galería de fotos. */
export function MaggieStory() {
  return (
    <>
      <section className="bg-arena">
        <ul className="contenedor grid gap-8 py-16 lg:grid-cols-3 lg:gap-12 lg:py-24">
          {values.map((value) => (
            <li key={value.title} className="flex flex-col gap-3.5">
              <h2 className="text-20 text-chocolate italic">{value.title}</h2>
              <p className="text-16 leading-amplio lg:text-17">{value.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="camino-titulo" className="contenedor flex flex-col gap-10 py-16 lg:gap-14 lg:py-26">
        <h2 id="camino-titulo" className="text-center text-34 lg:text-48">
          {timeline.title}
        </h2>
        <ol className="grid gap-6 border-t-trazo border-carbon md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {timeline.items.map((item) => (
            <li key={item.stage} className="flex flex-col gap-2.5 pt-6 lg:pt-7">
              <span className="font-display text-30 text-chocolate lg:text-36">{item.stage}</span>
              <span className="leading-parrafo text-secundario">{item.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <ul className="contenedor grid gap-3 pb-16 md:grid-cols-3 lg:gap-6 lg:pb-26">
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
