import type { Metadata } from "next";
import Link from "next/link";
import { Encabezado, PanelMain } from "@/components/admin/panel/Encabezado";
import { EstadoVacio } from "@/components/admin/ui/EstadoVacio";
import { Icono } from "@/components/admin/ui/Icono";
import { admin } from "@/data/admin";
import type { AdminWorkshop } from "@/lib/admin/workshops";
import { listarWorkshops } from "@/lib/admin/workshops";
import { requireAdminPage } from "@/lib/auth";
import { formatDay, formatTime } from "@/lib/format";

const content = admin.workshops;

export const metadata: Metadata = content.metadata;

function Tarjeta({ w, proximo }: { w: AdminWorkshop; proximo: boolean }) {
  const estado = w.isExample ? content.status.example : w.active ? content.status.active : content.status.hidden;
  return (
    <li>
      <Link
        href={`/admin/workshops/${w.id}`}
        className="flex h-full flex-col gap-2 rounded-3xl border border-borde bg-white p-5 text-carbon no-underline hover:border-chocolate"
      >
        <span className={`self-start rounded-full px-3 py-1 text-12 font-semibold ${w.active && !w.isExample ? "bg-exito-fondo text-exito" : "bg-arena text-chocolate"}`}>
          {estado}
        </span>
        <strong className="text-20">{w.name}</strong>
        <span className="text-14 text-secundario">
          {formatDay(w.startsAt)} · {formatTime(w.startsAt)}
        </span>
        <span className="text-15">{content.spots(w.spotsTaken, w.capacity)}</span>
        {proximo && w.price === null && <span className="text-14 text-secundario">{content.noPrice}</span>}
        {proximo && w.active && w.spotsReserved < w.minimum && (
          <span className="text-14 font-medium text-error">{content.belowMinimum(w.minimum)}</span>
        )}
      </Link>
    </li>
  );
}

export default async function WorkshopsPage() {
  const session = await requireAdminPage("/admin/workshops");
  const workshops = await listarWorkshops(session.supabase);
  const ahora = new Date().toISOString();
  const proximos = workshops.filter((w) => w.startsAt > ahora).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const pasados = workshops.filter((w) => w.startsAt <= ahora);

  return (
    <PanelMain>
      <Encabezado eyebrow={content.eyebrow} title={content.title}>
        <Link href="/admin/workshops/nuevo" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-chocolate px-5 text-15 font-semibold text-hueso no-underline hover:bg-carbon">
          <Icono nombre="mas" />
          {content.newWorkshop}
        </Link>
      </Encabezado>
      <section aria-labelledby="ws-proximos" className="flex flex-col gap-3">
        <h2 id="ws-proximos" className="text-26">{content.upcoming}</h2>
        {proximos.length === 0 ? (
          <EstadoVacio>{content.emptyUpcoming}</EstadoVacio>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {proximos.map((w) => (
              <Tarjeta key={w.id} w={w} proximo />
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="ws-pasados" className="flex flex-col gap-3">
        <h2 id="ws-pasados" className="text-26">{content.past}</h2>
        {pasados.length === 0 ? (
          <EstadoVacio>{content.emptyPast}</EstadoVacio>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pasados.map((w) => (
              <Tarjeta key={w.id} w={w} proximo={false} />
            ))}
          </ul>
        )}
      </section>
    </PanelMain>
  );
}
