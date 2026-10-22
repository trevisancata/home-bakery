import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TablaInscripciones } from "@/components/admin/inscripciones/TablaInscripciones";
import { PanelMain } from "@/components/admin/panel/Encabezado";
import { EstadoVacio } from "@/components/admin/ui/EstadoVacio";
import { Icono } from "@/components/admin/ui/Icono";
import { Pestanas } from "@/components/admin/workshops/Pestanas";
import { WorkshopForm } from "@/components/admin/workshops/WorkshopForm";
import { admin } from "@/data/admin";
import { NotFoundError } from "@/lib/admin/errors";
import { listarInscripcionesConPagos } from "@/lib/admin/pagos";
import { parseId } from "@/lib/admin/schemas";
import { obtenerWorkshop } from "@/lib/admin/workshops";
import { requireAdminPage } from "@/lib/auth";
import { formatDay, formatTime } from "@/lib/format";

const content = admin.workshops;

async function cargar(id: string) {
  const session = await requireAdminPage(`/admin/workshops/${id}`);
  try {
    return { session, workshop: await obtenerWorkshop(session.supabase, parseId(id)) };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/admin/workshops/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { workshop } = await cargar(id);
  return { title: workshop.name };
}

export default async function WorkshopPage({ params, searchParams }: PageProps<"/admin/workshops/[id]">) {
  const { id } = await params;
  const { tab, creado } = await searchParams;
  const { session, workshop } = await cargar(id);
  const inscripciones = await listarInscripcionesConPagos(session.supabase, { workshopId: workshop.id });

  return (
    <PanelMain>
      <div className="flex flex-col gap-1">
        <Link href="/admin/workshops" className="flex min-h-11 items-center gap-1 self-start text-14 text-secundario underline hover:text-carbon">
          <Icono nombre="volver" size={16} />
          {content.back}
        </Link>
        <h1 className="text-36 lg:text-44">{workshop.name}</h1>
        <p className="text-15 text-secundario">
          {formatDay(workshop.startsAt)} · {formatTime(workshop.startsAt)} · {content.spots(workshop.spotsTaken, workshop.capacity)}
        </p>
        {workshop.active && workshop.startsAt > new Date().toISOString() && workshop.spotsReserved < workshop.minimum && (
          <p className="text-15 font-medium text-error">{content.belowMinimum(workshop.minimum)}</p>
        )}
      </div>
      <Suspense>
        <Pestanas
          label={content.tabsLabel}
          inicial={typeof tab === "string" ? tab : "inscriptas"}
          pestanas={[
            {
              id: "inscriptas",
              label: `${content.tabs.inscriptas} (${inscripciones.length})`,
              contenido:
                inscripciones.length === 0 ? (
                  <EstadoVacio>{content.inscriptas.empty}</EstadoVacio>
                ) : (
                  <TablaInscripciones inscripciones={inscripciones} conWorkshop={false} />
                ),
            },
            { id: "datos", label: content.tabs.datos, contenido: <WorkshopForm workshop={workshop} creado={creado === "1"} /> },
          ]}
        />
      </Suspense>
    </PanelMain>
  );
}
