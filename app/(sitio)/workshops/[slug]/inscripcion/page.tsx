import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InscripcionForm } from "@/components/inscripcion/InscripcionForm";
import { pages, ui } from "@/data/site";
import { getWorkshop } from "@/lib/data";

const content = pages.inscripcion;

export async function generateMetadata({ params }: PageProps<"/workshops/[slug]/inscripcion">): Promise<Metadata> {
  const { slug } = await params;
  const workshop = await getWorkshop(slug);
  return workshop ? content.metadata(workshop.name) : {};
}

// Los lugares libres se leen en cada request: nada de caché acá.
export const dynamic = "force-dynamic";

export default async function InscripcionPage({ params }: PageProps<"/workshops/[slug]/inscripcion">) {
  const { slug } = await params;
  const workshop = await getWorkshop(slug);
  if (!workshop) notFound();

  // TODO(Maggie): cargar el workshop real. Las fechas de ejemplo no aceptan inscripciones.
  if (workshop.isExample) {
    return (
      <div className="contenedor flex flex-col items-start gap-5 pt-8 pb-16 lg:pt-12 lg:pb-26">
        <h1 className="text-38 lg:text-56">{workshop.name}</h1>
        <p className="rounded-2xl bg-arena px-5 py-4 text-17 font-semibold text-chocolate">{ui.exampleWorkshop}</p>
        <Link href="/workshops" className="py-2.5 font-semibold text-chocolate underline hover:text-carbon">
          {content.breadcrumb.parent.label}
        </Link>
      </div>
    );
  }

  return (
    <div className="contenedor pt-8 pb-16 lg:pt-12 lg:pb-26">
      <InscripcionForm workshop={workshop} />
    </div>
  );
}
