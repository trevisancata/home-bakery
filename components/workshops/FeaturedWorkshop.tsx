import { Button } from "@/components/Button";
import { ImageFrame } from "@/components/ImageFrame";
import { SectionTitle } from "@/components/SectionTitle";
import { pages, ui } from "@/data/site";
import { workshopEnrollHref, type Workshop } from "@/lib/data";
import { formatDay, formatDuration, formatMonth, formatPrice, formatTime } from "@/lib/format";

const { featured: content } = pages.workshops;

/**
 * Tarjeta arena con el próximo workshop: foto, datos, cupo y reserva. La
 * foto va primero en el DOM, así que en mobile queda arriba sin duplicarla.
 */
export function FeaturedWorkshop({ workshop }: { workshop: Workshop }) {
  const [image] = workshop.images;
  const taken = ((workshop.capacity - workshop.spotsLeft) / workshop.capacity) * 100;
  const details = [
    {
      term: content.details.date,
      value: <time dateTime={workshop.startsAt}>{formatDay(workshop.startsAt)}</time>,
    },
    {
      term: content.details.time,
      value: `${formatTime(workshop.startsAt)} · ${formatDuration(workshop.durationMinutes)}`,
    },
    { term: content.details.includes, value: workshop.includes },
    {
      term: content.details.price,
      value: workshop.price === null ? ui.priceTbd : formatPrice(workshop.price),
    },
  ];

  return (
    <article
      aria-labelledby="destacado-titulo"
      className="grid gap-6 rounded-3xl bg-arena p-4 lg:grid-cols-2 lg:gap-16 lg:rounded-4xl lg:p-10"
    >
      <ImageFrame
        src={image?.src}
        alt={image?.alt ?? ""}
        placeholderLabel={ui.imagePending}
        rounded="rounded-card-sm lg:rounded-3xl"
        sizes="(min-width: 1024px) 45vw, 100vw"
        preload
        className="h-64 lg:h-130"
      />

      <div className="flex flex-col gap-4 px-2 pb-2 lg:gap-5.5 lg:py-4 lg:pr-4 lg:pl-0">
        <p className="self-start rounded-full bg-chocolate px-3.5 py-2 text-12 font-semibold tracking-etiqueta text-hueso uppercase">
          {content.badge(formatMonth(workshop.startsAt))}
        </p>
        <SectionTitle id="destacado-titulo" title={workshop.name} size="text-34 leading-titulo lg:text-48" />
        <p className="text-16 leading-parrafo lg:text-17">{workshop.description}</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4.5">
          {details.map((detail) => (
            <div key={detail.term}>
              <dt className="text-13 text-secundario">{detail.term}</dt>
              <dd className="mt-1 font-semibold">{detail.value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-2">
          <p className="flex justify-between gap-4 text-14">
            <strong className="text-chocolate">{content.spotsLeft(workshop.spotsLeft)}</strong>
            <span className="text-secundario">{content.capacity(workshop.capacity)}</span>
          </p>
          <div aria-hidden="true" className="h-2.5 rounded-full bg-placeholder">
            <div className="h-2.5 rounded-full bg-chocolate" style={{ width: `${taken}%` }} />
          </div>
        </div>
        <Button href={workshopEnrollHref(workshop.slug)} size="lg" className="lg:self-start">
          {content.cta}
          <span className="sr-only">: {workshop.name}</span>
        </Button>
      </div>
    </article>
  );
}
