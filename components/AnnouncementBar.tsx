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

/**
 * Barra de avisos blanca, arriba de todo. En mobile muestra la versión corta.
 * Texto carbon sobre blanco: 13.39:1. Contra el header (taupe-header) el
 * blanco ya da 4.55:1, así que se distinguen sin borde; con el contenido
 * (hueso) no se toca, porque la barra queda arriba del header.
 */
export function AnnouncementBar() {
  return (
    <aside aria-label={ui.announcementsLabel} className="bg-white text-carbon">
      <p className="contenedor py-2.25 text-center text-12 leading-natural md:hidden">
        <Items items={announcements.short} />
      </p>
      <p className="contenedor hidden py-2.75 text-center text-13 leading-natural tracking-aviso md:block">
        <Items items={announcements.full} />
      </p>
    </aside>
  );
}
