type Level = "h1" | "h2" | "h3";

const sizes: Record<Level, string> = {
  h1: "text-4xl sm:text-5xl lg:text-6xl",
  h2: "text-3xl sm:text-4xl lg:text-5xl",
  h3: "text-2xl sm:text-3xl",
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
    <Tag id={id} className={`leading-tight ${sizes[Tag]} ${className}`}>
      {script && index !== -1 ? (
        <>
          {title.slice(0, index)}
          <span className="px-[0.08em] font-script text-[1.45em] leading-[0] text-chocolate">
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
