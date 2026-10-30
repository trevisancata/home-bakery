type Level = "h1" | "h2" | "h3";

// Tamaños por defecto del mockup: mobile (390 px) → desktop (1440 px).
const sizes: Record<Level, string> = {
  h1: "text-44 leading-titulo tracking-titulo lg:text-64 lg:leading-hero xl:text-76",
  h2: "text-34 lg:text-48",
  h3: "text-21 lg:text-26",
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
  /** Reemplaza los tamaños por defecto del nivel. */
  size?: string;
  className?: string;
};

/** Título del sistema: Gilda Display con un acento manuscrito opcional. */
export function SectionTitle({ title, script, as: Tag = "h2", id, size, className = "" }: SectionTitleProps) {
  const index = script ? title.indexOf(script) : -1;

  return (
    <Tag id={id} className={`${size ?? sizes[Tag]} ${className}`}>
      {script && index !== -1 ? (
        <>
          {title.slice(0, index)}
          <span className="manuscrita">{script}</span>
          {title.slice(index + script.length)}
        </>
      ) : (
        title
      )}
    </Tag>
  );
}
