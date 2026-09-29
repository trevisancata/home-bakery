import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";
import { SectionTitle } from "./SectionTitle";

type SectionProps = {
  /** Se usa para el id del título y para enlazar la sección con aria-labelledby. */
  id: string;
  title: string;
  /** Palabra del título en letra manuscrita (ver SectionTitle). */
  script?: string;
  eyebrow?: string;
  intro?: ReactNode;
  tone?: "hueso" | "arena";
  align?: "start" | "center";
  children: ReactNode;
  className?: string;
};

/** Sección de página con título h2 asociado por aria-labelledby. */
export function Section({
  id,
  title,
  script,
  eyebrow,
  intro,
  tone = "hueso",
  align = "start",
  children,
  className = "",
}: SectionProps) {
  const headingId = `${id}-titulo`;
  const centered = align === "center";

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`${tone === "arena" ? "bg-arena" : "bg-hueso"} py-16 lg:py-24 ${className}`}
    >
      <div className="contenedor">
        <header className={`mb-10 max-w-2xl lg:mb-14 ${centered ? "mx-auto text-center" : ""}`}>
          {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
          <SectionTitle id={headingId} title={title} script={script} />
          {intro && <div className="mt-4 text-lg text-secundario">{intro}</div>}
        </header>
        {children}
      </div>
    </section>
  );
}
