import type { Metadata } from "next";
import { Suspense } from "react";
import { Devoluciones } from "@/components/admin/inscripciones/Devoluciones";
import { FiltrosInscripciones } from "@/components/admin/inscripciones/FiltrosInscripciones";
import { TablaInscripciones } from "@/components/admin/inscripciones/TablaInscripciones";
import { Encabezado, PanelMain } from "@/components/admin/panel/Encabezado";
import { EstadoVacio } from "@/components/admin/ui/EstadoVacio";
import { admin } from "@/data/admin";
import { armarDevoluciones } from "@/lib/admin/devoluciones";
import { listarInscripcionesConPagos } from "@/lib/admin/pagos";
import { listarPedidos } from "@/lib/admin/pedidos";
import { listarWorkshops } from "@/lib/admin/workshops";
import { requireAdminPage } from "@/lib/auth";

const content = admin.inscripciones;

export const metadata: Metadata = content.metadata;

export default async function InscripcionesPage({ searchParams }: PageProps<"/admin/inscripciones">) {
  const session = await requireAdminPage("/admin/inscripciones");
  const [inscripciones, workshops, pedidos, { workshop, estado }] = await Promise.all([
    listarInscripcionesConPagos(session.supabase),
    listarWorkshops(session.supabase),
    listarPedidos(session.supabase),
    searchParams,
  ]);

  const filtradas = inscripciones.filter(
    (i) => (!workshop || i.workshopId === workshop) && (!estado || i.estado === estado),
  );
  // Para devolver: todos (no dependen de los filtros), de workshops y de pedidos, y los ya devueltos.
  const devoluciones = armarDevoluciones(inscripciones, pedidos);

  return (
    <PanelMain>
      <Encabezado eyebrow={content.eyebrow} title={content.title} />
      <Suspense>
        <FiltrosInscripciones workshops={workshops.map((w) => ({ id: w.id, name: w.name }))} />
      </Suspense>
      <p aria-live="polite" className="text-14 text-secundario">
        {content.count(filtradas.length)}
      </p>
      {filtradas.length === 0 ? (
        <EstadoVacio>{content.empty}</EstadoVacio>
      ) : (
        <TablaInscripciones key={`${workshop ?? ""}-${estado ?? ""}`} inscripciones={filtradas} conWorkshop />
      )}
      <Devoluciones iniciales={devoluciones} />
    </PanelMain>
  );
}
