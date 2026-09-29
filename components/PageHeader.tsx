import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";
import { SectionTitle } from "./SectionTitle";

/** Encabezado de página interna: contiene el único h1 de la página. */
export function PageHeader({
  eyebrow,
  title,
  script,
  children,
}: {
  eyebrow?: string;
  title: string;
  script?: string;
  children?: ReactNode;
}) {
  return (
    <header className="px-4 pt-12 pb-12 text-center sm:px-6 lg:pt-20 lg:pb-16">
      <div className="mx-auto max-w-3xl">
        {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
        <SectionTitle as="h1" title={title} script={script} />
        {children && <div className="mx-auto mt-6 max-w-2xl text-lg text-secundario">{children}</div>}
      </div>
    </header>
  );
}
