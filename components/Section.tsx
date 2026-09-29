import type { ReactNode } from "react";

type SectionProps = {
  /** Se usa para el id del título y para enlazar la sección con aria-labelledby. */
  id: string;
  title: string;
  eyebrow?: string;
  intro?: ReactNode;
  tone?: "hueso" | "arena";
  children: ReactNode;
  className?: string;
};

/** Sección de página con título h2 asociado por aria-labelledby. */
export function Section({
  id,
  title,
  eyebrow,
  intro,
  tone = "hueso",
  children,
  className = "",
}: SectionProps) {
  const headingId = `${id}-titulo`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`${tone === "arena" ? "bg-arena" : "bg-hueso"} px-4 py-16 sm:px-6 lg:py-24 ${className}`}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 max-w-2xl">
          {eyebrow && (
            <p className="mb-2 text-sm font-bold tracking-widest text-chocolate uppercase">
              {eyebrow}
            </p>
          )}
          <h2 id={headingId} className="text-3xl sm:text-4xl">
            {title}
          </h2>
          {intro && <div className="mt-4 text-lg text-secundario">{intro}</div>}
        </header>
        {children}
      </div>
    </section>
  );
}
