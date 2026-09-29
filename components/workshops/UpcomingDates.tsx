import Link from "next/link";
import { Button } from "@/components/Button";
import { pages, whatsappLink, whatsappMessages } from "@/data/site";
import { workshopEnrollHref, type Workshop } from "@/lib/data";
import { formatDay, formatMonth, formatTime } from "@/lib/format";

const { upcoming: content } = pages.workshops;

type Status = keyof typeof content.status;

const statusColors: Record<Status, string> = {
  open: "text-abierto",
  last: "text-chocolate",
  soldOut: "text-secundario",
};

/** Agotado sin lugares; "últimos lugares" con un cuarto del cupo o menos. */
function statusOf(workshop: Workshop): Status {
  if (workshop.spotsLeft === 0) return "soldOut";
  if (workshop.spotsLeft <= workshop.capacity / 4) return "last";
  return "open";
}

/**
 * Lista de próximas fechas: una fila de cuatro columnas en desktop
 * (mes · workshop · estado · acción) y apilada en el mismo orden en mobile.
 */
export function UpcomingDates({ workshops }: { workshops: Workshop[] }) {
  return (
    <section aria-labelledby="fechas-titulo" className="flex flex-col gap-2">
      <h2 id="fechas-titulo" className="mb-3 text-34 lg:text-40">
        {content.title}
      </h2>
      <ul className="flex flex-col gap-2">
        {workshops.map((workshop) => {
          const status = statusOf(workshop);
          const soldOut = status === "soldOut";

          return (
            <li
              key={workshop.id}
              className="grid gap-2 border-b border-borde py-6 lg:grid-cols-fechas lg:items-center lg:gap-6"
            >
              <p className={`font-display text-22 ${soldOut ? "text-secundario" : ""}`}>
                {formatMonth(workshop.startsAt)}
              </p>
              <div className="flex flex-col gap-1">
                <h3 className={`font-sans text-18 font-bold ${soldOut ? "text-secundario" : ""}`}>{workshop.name}</h3>
                <p className="text-14 text-secundario">
                  <time dateTime={workshop.startsAt}>{formatDay(workshop.startsAt)}</time> ·{" "}
                  {formatTime(workshop.startsAt)}
                </p>
              </div>
              <p className={`text-14 font-semibold ${statusColors[status]}`}>{content.status[status]}</p>
              {soldOut ? (
                <Button
                  href={whatsappLink(whatsappMessages.workshopWaitlist(workshop.name))}
                  variant="secondary"
                  size="sm"
                  className="mt-2 self-start lg:mt-0 lg:justify-self-end"
                >
                  {content.waitlist}
                  <span className="sr-only">: {workshop.name}</span>
                </Button>
              ) : (
                <Link
                  href={workshopEnrollHref(workshop.slug)}
                  className="justify-self-start py-2.5 font-semibold text-chocolate underline hover:text-carbon lg:justify-self-end lg:py-0"
                >
                  {content.cta}
                  <span className="sr-only">: {workshop.name}</span>{" "}
                  <span aria-hidden="true" className="font-simbolos">
                    →
                  </span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
