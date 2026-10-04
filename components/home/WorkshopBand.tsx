import { Fragment } from "react";
import { BackgroundVideo } from "@/components/BackgroundVideo";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { SectionTitle } from "@/components/SectionTitle";
import { pages } from "@/data/site";
import type { Workshop } from "@/lib/data";
import { formatDay } from "@/lib/format";

const { workshop: content } = pages.home;

/**
 * Banda chocolate que presenta los workshops ("Grupos reducidos en mi
 * cocina"), con video de la dinámica de cocina y la próxima fecha en una
 * línea chica. El video va arriba en mobile y a la derecha en desktop.
 */
export function WorkshopBand({ nextWorkshop }: { nextWorkshop?: Workshop }) {
  return (
    <section aria-labelledby="workshops-titulo" className="contenedor mb-12 lg:mb-0">
      <div
        data-surface="dark"
        className="flex flex-col overflow-hidden rounded-3xl bg-chocolate text-hueso lg:grid lg:grid-cols-2 lg:rounded-4xl"
      >
        <BackgroundVideo
          src={content.video.src}
          poster={content.video.poster}
          className="relative h-55 lg:order-last lg:h-auto lg:min-h-130"
        />

        <div className="flex flex-col gap-3.5 p-6 lg:gap-5.5 lg:p-18">
          <Eyebrow tone="crema">{content.eyebrow}</Eyebrow>
          <SectionTitle
            id="workshops-titulo"
            title={content.title}
            script={content.script}
            size="text-30 leading-titulo lg:text-48 lg:leading-[1.1]"
            className="text-hueso"
          />
          <p className="text-15 leading-parrafo text-crema-suave lg:text-17">
            {content.text[0]}
            <span className="hidden lg:inline"> {content.text[1]}</span>
          </p>
          <ul className="flex flex-wrap text-14 text-crema-suave lg:gap-7 lg:text-15">
            {content.facts.map((fact, index) => (
              <Fragment key={fact}>
                {index > 0 && (
                  <li aria-hidden="true" className="lg:hidden">
                    &nbsp;·&nbsp;
                  </li>
                )}
                <li>{fact}</li>
              </Fragment>
            ))}
          </ul>
          {nextWorkshop && (
            <p className="border-t border-chocolate-claro pt-3.5 text-14 text-crema lg:pt-4.5 lg:text-15">
              {content.next}{" "}
              <strong className="font-semibold">
                {nextWorkshop.name} ·{" "}
                <time dateTime={nextWorkshop.startsAt}>{formatDay(nextWorkshop.startsAt)}</time>
              </strong>
            </p>
          )}
          <Button href={content.cta.href} variant="light" className="lg:mt-2 lg:self-start">
            {content.cta.label}
          </Button>
        </div>
      </div>
    </section>
  );
}
