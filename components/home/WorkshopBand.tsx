import { Fragment } from "react";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { ImageFrame } from "@/components/ImageFrame";
import { SectionTitle } from "@/components/SectionTitle";
import { pages, ui, whatsappLink, whatsappMessages } from "@/data/site";
import type { Workshop } from "@/lib/data";
import { formatDay, formatPrice, formatTime } from "@/lib/format";

const { workshop: content } = pages.home;

/**
 * Banda chocolate con el workshop del mes. La foto va arriba en mobile y a
 * la derecha en desktop: se renderiza dos veces (una oculta con
 * display: none) para que el orden del DOM coincida con el visual.
 */
export function WorkshopBand({ workshop }: { workshop: Workshop }) {
  const [image] = workshop.images;
  const taken = ((workshop.capacity - workshop.spotsLeft) / workshop.capacity) * 100;
  const details = [
    <time key="dia" dateTime={workshop.startsAt}>
      {formatDay(workshop.startsAt)}
    </time>,
    formatTime(workshop.startsAt),
    workshop.price === null ? ui.priceTbd : formatPrice(workshop.price),
  ];
  const photo = {
    src: image?.src,
    alt: image?.alt ?? "",
    placeholderLabel: ui.imagePending,
    tone: "oscuro",
    rounded: "rounded-none",
  } as const;

  return (
    <section aria-labelledby="workshop-titulo" className="contenedor mb-12 lg:mb-0">
      <div
        data-surface="dark"
        className="grid overflow-hidden rounded-3xl bg-chocolate text-hueso lg:grid-cols-2 lg:rounded-4xl"
      >
        <ImageFrame {...photo} sizes="100vw" className="h-50 lg:hidden" />

        <div className="flex flex-col gap-3.5 p-6 lg:gap-5.5 lg:p-18">
          <Eyebrow tone="crema">{content.eyebrow}</Eyebrow>
          <SectionTitle id="workshop-titulo" title={workshop.name} size="text-30 lg:text-48" className="text-hueso" />
          <p className="hidden text-17 leading-parrafo text-crema-suave lg:block">
            {workshop.summary} {content.suffix}
          </p>
          <p className="text-15 text-crema-suave lg:flex lg:gap-8">
            {details.map((detail, index) => (
              <Fragment key={index}>
                {index > 0 && (
                  <span aria-hidden="true" className="lg:hidden">
                    {" · "}
                  </span>
                )}
                <span>{detail}</span>
              </Fragment>
            ))}
          </p>
          <div className="flex flex-col gap-3.5 lg:max-w-90 lg:gap-2">
            <div aria-hidden="true" className="h-2 rounded-full bg-chocolate-claro">
              <div className="h-2 rounded-full bg-crema" style={{ width: `${taken}%` }} />
            </div>
            <p className="text-14 font-semibold text-crema">{content.spots(workshop.spotsLeft, workshop.capacity)}</p>
          </div>
          <Button
            href={whatsappLink(whatsappMessages.workshop(workshop.name))}
            variant="light"
            className="lg:mt-2 lg:self-start"
          >
            {content.cta}
          </Button>
        </div>

        <ImageFrame {...photo} sizes="45vw" className="hidden min-h-120 lg:block" />
      </div>
    </section>
  );
}
