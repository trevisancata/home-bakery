type Level = "h1" | "h2" | "h3";

// Tamaños del mockup: mobile (390 px) → desktop (1440 px).
const sizes: Record<Level, string> = {
  h1: "text-44 leading-titulo tracking-titulo lg:text-76 lg:leading-hero",
  h2: "text-34 leading-natural lg:text-48",
  h3: "text-21 leading-snug lg:text-26",
};

type SectionTitleProps = {
  title: string;
  /**
   * Palabra (o dos) del título que se muestra en letra manuscrita.
   * Tiene que aparecer tal cual dentro de `title`.
   */
  script?: string;
  as?: Level;
  id?: string;
  className?: string;
};

/** Título del sistema: Gilda Display con un acento manuscrito opcional. */
export function SectionTitle({ title, script, as: Tag = "h2", id, className = "" }: SectionTitleProps) {
  const index = script ? title.indexOf(script) : -1;

  return (
    <Tag id={id} className={`${sizes[Tag]} ${className}`}>
      {script && index !== -1 ? (
        <>
          {title.slice(0, index)}
          <span className="manuscrita">
            {script}
          </span>
          {title.slice(index + script.length)}
        </>
      ) : (
        title
      )}
    </Tag>
  );
}
