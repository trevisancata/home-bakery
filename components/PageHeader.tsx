import type { ReactNode } from "react";

/** Encabezado de página interna: contiene el único h1 de la página. */
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="px-4 pt-12 pb-10 sm:px-6 lg:pt-20">
      <div className="mx-auto max-w-6xl">
        {eyebrow && (
          <p className="mb-3 text-sm font-bold tracking-widest text-terracota uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl font-semibold sm:text-5xl">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-lg text-cacao-suave">{children}</div>}
      </div>
    </header>
  );
}
