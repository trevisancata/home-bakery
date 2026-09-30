import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InscripcionForm } from "@/components/inscripcion/InscripcionForm";
import { pages } from "@/data/site";
import { getWorkshop } from "@/lib/data";

const content = pages.inscripcion;

export async function generateMetadata({ params }: PageProps<"/workshops/[slug]/inscripcion">): Promise<Metadata> {
  const { slug } = await params;
  const workshop = await getWorkshop(slug);
  return workshop ? content.metadata(workshop.name) : {};
}

// Sin generateStaticParams: los lugares libres se leen en cada request.
export default async function InscripcionPage({ params }: PageProps<"/workshops/[slug]/inscripcion">) {
  const { slug } = await params;
  const workshop = await getWorkshop(slug);
  if (!workshop) notFound();

  return (
    <div className="contenedor pt-8 pb-16 lg:pt-12 lg:pb-26">
      <InscripcionForm workshop={workshop} />
    </div>
  );
}
