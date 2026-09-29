import { Adaptive } from "@/components/Adaptive";
import { Eyebrow } from "@/components/Eyebrow";
import { Rich } from "@/components/Rich";
import { pages } from "@/data/site";

const { pickup } = pages.home;

/** Horarios de retiro y envíos. En mobile el título queda solo para lectores de pantalla. */
export function Pickup() {
  return (
    <section aria-labelledby="retiros-titulo" className="contenedor mb-12 lg:mb-26">
      <div className="flex flex-col gap-2.5 rounded-3xl border border-borde p-6 lg:grid lg:grid-cols-3 lg:gap-12 lg:rounded-4xl lg:p-16">
        <div className="flex flex-col gap-3.5">
          <Eyebrow>
            <Adaptive full={pickup.eyebrow.full} short={pickup.eyebrow.short} />
          </Eyebrow>
          <h2 id="retiros-titulo" className="sr-only text-34 lg:not-sr-only">
            {pickup.title}
          </h2>
          <p className="hidden leading-parrafo text-secundario lg:block">{pickup.text}</p>
        </div>

        <dl className="flex flex-col gap-2.5 text-16 lg:gap-3">
          {pickup.hours.map((row) => (
            <div key={row.days.full} className="flex justify-between border-b border-borde py-3 last:border-b-0 lg:py-3.5">
              <dt>
                <Adaptive full={row.days.full} short={row.days.short} />
              </dt>
              <dd className={row.closed ? "text-secundario" : "font-bold"}>{row.time}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-1.5 rounded-2xl bg-arena p-4 text-15 leading-medio lg:mt-0 lg:flex lg:flex-col lg:gap-4 lg:rounded-card lg:p-7 lg:leading-parrafo">
          <p className="hidden text-16 leading-natural font-bold lg:block">{pickup.farAway.title}</p>
          <p>
            <Adaptive full={<Rich text={pickup.farAway.full} />} short={<Rich text={pickup.farAway.short} />} />
          </p>
        </div>
      </div>
    </section>
  );
}
