import { Fragment } from "react";
import { announcements, ui } from "@/data/site";

function Items({ items }: { items: string[] }) {
  return items.map((item, index) => (
    <Fragment key={item}>
      {index > 0 && <span aria-hidden="true"> · </span>}
      {/* Cada aviso se mantiene entero: el corte de línea cae entre avisos. */}
      <span className="inline-block">{item}</span>
    </Fragment>
  ));
}

/** Barra de avisos en chocolate, arriba de todo. En mobile muestra la versión corta. */
export function AnnouncementBar() {
  return (
    <aside aria-label={ui.announcementsLabel} data-surface="dark" className="bg-chocolate text-hueso">
      <p className="contenedor py-2.25 text-center text-xs leading-[1.3] md:hidden">
        <Items items={announcements.short} />
      </p>
      <p className="contenedor hidden py-2.75 text-center text-[0.8125rem] leading-[1.3] tracking-[0.02em] md:block">
        <Items items={announcements.full} />
      </p>
    </aside>
  );
}
