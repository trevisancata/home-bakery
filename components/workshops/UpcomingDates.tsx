import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { pages, ui, whatsappLink, whatsappMessages } from "@/data/site";
import { workshopEnrollHref, type Workshop } from "@/lib/data";
import { formatDay, formatDayNumber, formatMonth, formatPrice, formatTime } from "@/lib/format";

const { upcoming: content } = pages.workshops;

/**
 * Agenda de próximas fechas, con el cupo de cada una. El workshop del mes es
 * una fila más. En desktop, cuatro columnas (fecha · workshop · cupo ·
 * acción); en mobile, apiladas en el mismo orden.
 */
export function UpcomingDates({ workshops }: { workshops: Workshop[] }) {
  return (
    <section id="agenda" aria-labelledby="agenda-titulo" className="flex flex-col gap-2">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 id="agenda-titulo" className="text-34 lg:text-48">
            {content.title}
          </h2>
        </div>
        <p className="text-15 text-secundario lg:text-16">{content.note}</p>
      </div>
      <ul className="border-t border-borde">
        {workshops.map((workshop) => {
          const soldOut = workshop.spotsLeft === 0;
          const taken = ((workshop.capacity - workshop.spotsLeft) / workshop.capacity) * 100;
          const muted = soldOut ? "text-secundario" : "";

          return (
            <li
              key={workshop.id}
              className="grid gap-3 border-b border-borde py-6 lg:grid-cols-fechas lg:items-center lg:gap-6"
            >
              {/* La fecha completa va en la línea del workshop: acá es solo visual. */}
              <p aria-hidden="true" className="flex items-baseline gap-2 lg:flex-col lg:gap-1">
                <span className={`font-display text-34 leading-none lg:text-40 ${muted}`}>
                  {formatDayNumber(workshop.startsAt)}
                </span>
                <span className="font-label text-12 tracking-eyebrow text-chocolate uppercase">
                  {formatMonth(workshop.startsAt)}
                </span>
              </p>
              <div className="flex flex-col gap-1">
                <h3 className={`font-sans text-18 font-bold lg:text-20 ${muted}`}>{workshop.name}</h3>
                <p className="text-14 text-secundario">
                  <time dateTime={workshop.startsAt}>{formatDay(workshop.startsAt)}</time> ·{" "}
                  {formatTime(workshop.startsAt)} ·{" "}
                  {workshop.price === null ? ui.priceTbd : formatPrice(workshop.price)}
                </p>
              </div>
              {workshop.isExample ? (
                // TODO(Maggie): cargar el workshop real. Mientras tanto, sin Reservar.
                <p className="justify-self-start rounded-full bg-arena px-4 py-2 text-14 font-semibold text-chocolate lg:col-span-2 lg:justify-self-end">
                  {ui.exampleWorkshop}
                </p>
              ) : (
                <>
                {soldOut ? (
                  <p className="text-14 font-semibold text-secundario">{content.soldOut}</p>
                ) : (
                  <div className="flex flex-col gap-2 lg:max-w-50">
                    <p className="text-14 font-semibold">{content.spots(workshop.spotsLeft, workshop.capacity)}</p>
                    <div aria-hidden="true" className="h-1.5 rounded-full bg-placeholder">
                      <div className="h-1.5 rounded-full bg-chocolate" style={{ width: `${taken}%` }} />
                    </div>
                  </div>
                )}
                {soldOut ? (
                  <Button
                    href={whatsappLink(whatsappMessages.workshopWaitlist(workshop.name))}
                    variant="secondary"
                    size="sm"
                    className="mt-1 justify-self-start lg:mt-0 lg:justify-self-end"
                  >
                    {content.waitlist}
                    <span className="sr-only">: {workshop.name}</span>
                  </Button>
                ) : (
                  <Button
                    href={workshopEnrollHref(workshop.slug)}
                    size="sm"
                    className="mt-1 justify-self-start lg:mt-0 lg:min-h-12 lg:justify-self-end lg:px-7"
                  >
                    {content.cta}
                    <span className="sr-only">: {workshop.name}</span>
                  </Button>
                )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
