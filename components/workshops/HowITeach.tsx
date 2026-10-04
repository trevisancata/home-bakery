import { ImageFrame } from "@/components/ImageFrame";
import { pages, ui } from "@/data/site";

const { teaching } = pages.workshops;

/** "Cómo enseño": el texto de Maggie con su firma y una foto en arco. */
export function HowITeach() {
  return (
    <section
      aria-labelledby="ensenanza-titulo"
      className="contenedor grid items-center gap-8 py-14 lg:grid-cols-ensenanza lg:gap-20 lg:py-26"
    >
      <div className="flex flex-col gap-5 lg:gap-6">
        <h2
          id="ensenanza-titulo"
          className="font-label text-14 font-normal tracking-eyebrow text-chocolate uppercase"
        >
          {teaching.eyebrow}
        </h2>
        <p className="font-display text-26 leading-[1.3] lg:text-38">{teaching.text[0]}</p>
        <p className="max-w-155 text-17 leading-amplio text-secundario lg:text-18">{teaching.text[1]}</p>
        <p className="text-32 leading-none">
          <span className="manuscrita">{teaching.signature}</span>
        </p>
      </div>
      <ImageFrame
        alt={teaching.image.alt}
        placeholderLabel={ui.imagePending}
        rounded="rounded-t-arco-sm rounded-b-card lg:rounded-t-arco lg:rounded-b-3xl"
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="h-100 lg:h-150"
      />
    </section>
  );
}
