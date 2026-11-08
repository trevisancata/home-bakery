import { pages } from "@/data/site";

const { teaching } = pages.workshops;

/** "Cómo enseño": el texto de Maggie, solo (sin firma ni foto). */
export function HowITeach() {
  return (
    <section aria-labelledby="ensenanza-titulo" className="contenedor flex flex-col gap-5 py-14 lg:gap-6 lg:py-26">
      <h2 id="ensenanza-titulo" className="font-label text-14 font-normal tracking-eyebrow text-chocolate uppercase">
        {teaching.eyebrow}
      </h2>
      {/* El párrafo grande se lee mejor con un ancho de línea acotado. */}
      <p className="max-w-215 font-display text-26 leading-[1.3] lg:text-38">{teaching.text[0]}</p>
      <p className="max-w-155 text-17 leading-amplio text-secundario lg:text-18">{teaching.text[1]}</p>
    </section>
  );
}
