import { Fragment } from "react";
import { announcements, ui } from "@/data/site";

/** Barra de avisos en chocolate, arriba de todo. */
export function AnnouncementBar() {
  return (
    <aside aria-label={ui.announcementsLabel} data-surface="dark" className="bg-chocolate text-hueso">
      <p className="mx-auto max-w-6xl px-4 py-2 text-center text-[0.8125rem] leading-relaxed sm:px-6 sm:text-sm">
        {announcements.map((item, index) => (
          <Fragment key={item}>
            {index > 0 && (
              <span aria-hidden="true" className="mx-2">
                ·
              </span>
            )}
            {/* Cada aviso se mantiene entero: el corte de línea cae entre avisos. */}
            <span className="inline-block">{item}</span>
          </Fragment>
        ))}
      </p>
    </aside>
  );
}
