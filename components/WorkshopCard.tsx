import { ui, whatsappLink, whatsappMessages } from "@/data/site";
import type { Workshop } from "@/lib/data";
import { formatDate, formatDuration, formatPrice } from "@/lib/format";
import { Button } from "./Button";
import { ImageFrame } from "./ImageFrame";

export function WorkshopCard({ workshop }: { workshop: Workshop }) {
  const details = [
    { term: ui.workshop.duration, value: formatDuration(workshop.durationMinutes) },
    { term: ui.workshop.level, value: workshop.level },
    { term: ui.workshop.spots, value: `${workshop.capacity} ${ui.workshop.spotsUnit}` },
    { term: ui.workshop.price, value: formatPrice(workshop.price) },
  ];

  const [image] = workshop.images;

  return (
    <article className="flex h-full flex-col rounded-4xl bg-hueso p-3 ring-1 ring-greige">
      <ImageFrame
        src={image?.src}
        alt={image?.alt ?? ""}
        placeholderLabel={ui.imagePending}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      />
      <div className="flex flex-1 flex-col gap-3 px-3 pt-5 pb-3">
        <p className="font-label text-xs tracking-eyebrow text-chocolate uppercase">
          <time dateTime={workshop.startsAt}>
            {formatDate(workshop.startsAt)} {ui.workshop.timeSuffix}
          </time>
        </p>
        <h3 className="text-2xl">{workshop.name}</h3>
        <p className="text-secundario">{workshop.description}</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-greige pt-4 text-sm">
          {details.map((detail) => (
            <div key={detail.term}>
              <dt className="font-medium">{detail.term}</dt>
              <dd className="text-secundario">{detail.value}</dd>
            </div>
          ))}
        </dl>
        <Button
          href={whatsappLink(whatsappMessages.workshop(workshop.name))}
          variant="secondary"
          className="mt-auto self-start"
        >
          {ui.workshop.enroll}
          <span className="sr-only"> {workshop.name}</span>
        </Button>
      </div>
    </article>
  );
}
