import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PanelMain } from "@/components/admin/panel/Encabezado";
import { AccionesPedido } from "@/components/admin/pedidos/AccionesPedido";
import { claseEstado, etiquetaEstado } from "@/components/admin/pedidos/TarjetaPedido";
import { Icono } from "@/components/admin/ui/Icono";
import { admin } from "@/data/admin";
import { NotFoundError } from "@/lib/admin/errors";
import { leerPedido } from "@/lib/admin/pedidos";
import { avisoListo, avisoWhatsApp, cuando, entregaDe, estadoDelPago, historial, vencido } from "@/lib/admin/pedidos-panel";
import { requireAdminPage } from "@/lib/auth";
import { etiquetaVisible } from "@/lib/tamano";
import { formatDay, formatPrice, formatTime } from "@/lib/format";
import { waLink } from "@/lib/whatsapp-numero";

const content = admin.pedidos;
const d = content.detail;

async function cargar(id: string) {
  const session = await requireAdminPage(`/admin/pedidos/${id}`);
  try {
    const leido = await leerPedido(session.supabase, id);
    if (!leido) notFound();
    return { session, ...leido, now: Date.now() };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/admin/pedidos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { pedido } = await cargar(id);
  return d.metadata(pedido.numero);
}

const card = "flex flex-col gap-3 rounded-3xl border border-borde bg-white p-5 lg:p-6";

/** Detalle de un pedido: qué se pidió, para cuándo, quién, cómo pagó, qué pasó y qué sigue. */
export default async function PedidoPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await params;
  const { session, pedido, items, now } = await cargar(id);
  const eventos = historial(pedido, session.userId);
  const motivo = pedido.motivoCancelacion ? d.cancelReason(pedido.motivoCancelacion) : pedido.motivoRechazo ? d.rejectReason(pedido.motivoRechazo) : null;

  return (
    <PanelMain>
      <Link href="/admin/pedidos" className="flex min-h-11 items-center gap-1.5 self-start text-15 font-semibold text-chocolate">
        <Icono nombre="volver" />
        {d.back}
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-36 lg:text-44">{content.number(pedido.numero)}</h1>
        {/* El foco vuelve acá después de cada acción: se lee el estado nuevo. */}
        <p id="pedido-estado" tabIndex={-1} className="flex flex-wrap items-center gap-2 text-16 focus:outline-none">
          <span className={`rounded-full px-3 py-1 text-14 font-semibold ${claseEstado(pedido, now)}`}>{etiquetaEstado(pedido, now)}</span>
          <span>{estadoDelPago(pedido, now)}</span>
        </p>
        {motivo && <p className="text-15 text-secundario">{motivo}</p>}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <AccionesPedido pedido={pedido} vencida={vencido(pedido, now)} avisoWhatsApp={avisoWhatsApp(pedido)} avisoListo={avisoListo(pedido)} />

          <section aria-labelledby="pedido-items" className={card}>
            <h2 id="pedido-items" className="text-24">
              {d.items}
            </h2>
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 border-b border-borde-suave pb-3 text-15 last:border-0 last:pb-0">
                  <span className="flex flex-col">
                    <strong>
                      {item.cantidad} × {item.nombre}
                    </strong>
                    <span className="text-14 text-secundario">{[etiquetaVisible(item.tamano), item.sabor, item.decoracion].filter(Boolean).join(" · ")}</span>
                    <span className="text-13 text-secundario">
                      {d.columns.price}: {formatPrice(item.precioUnitario)}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold">{formatPrice(item.subtotal)}</span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between gap-4 border-t border-borde pt-3 text-18 font-semibold">
              <span>{d.total}</span>
              <span>{formatPrice(pedido.total)}</span>
            </p>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section aria-labelledby="pedido-entrega" className={card}>
            <h2 id="pedido-entrega" className="text-24">
              {d.delivery}
            </h2>
            <p className="text-16 font-semibold">{cuando(pedido)}</p>
            <p className="text-15">{entregaDe(pedido)}</p>
          </section>

          <section aria-labelledby="pedido-contacto" className={card}>
            <h2 id="pedido-contacto" className="text-24">
              {d.contact}
            </h2>
            <p className="flex flex-col text-15">
              <strong>{pedido.nombre}</strong>
              <span>{pedido.telefono}</span>
              <a href={`mailto:${pedido.email}`} className="break-all text-chocolate underline">
                {pedido.email}
              </a>
            </p>
            <a
              href={waLink(pedido.telefono, "")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center self-start rounded-full border-trazo border-carbon px-5 font-semibold text-carbon no-underline hover:bg-arena"
            >
              {d.whatsapp(pedido.nombre.split(" ")[0])}
              <span className="sr-only">{d.whatsappContext}</span>
            </a>
          </section>

          <section aria-labelledby="pedido-notas" className={card}>
            <h2 id="pedido-notas" className="text-24">
              {d.notes}
            </h2>
            <p className="text-15 whitespace-pre-line">{pedido.notas ?? d.noNotes}</p>
          </section>

          <section aria-labelledby="pedido-historial" className={card}>
            <h2 id="pedido-historial" className="text-24">
              {d.history}
            </h2>
            <ol className="flex flex-col gap-2 text-15">
              {eventos.map((evento, i) => (
                <li key={i} className="flex flex-col">
                  <span>{evento.texto}</span>
                  <span className="text-13 text-secundario">
                    {formatDay(evento.cuando)} · {formatTime(evento.cuando)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </PanelMain>
  );
}
