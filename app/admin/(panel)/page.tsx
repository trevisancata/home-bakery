import type { Metadata } from "next";
import Link from "next/link";
import { Encabezado, PanelMain } from "@/components/admin/panel/Encabezado";
import { EstadoVacio } from "@/components/admin/ui/EstadoVacio";
import { admin } from "@/data/admin";
import { armarDevoluciones } from "@/lib/admin/devoluciones";
import { listarInscripcionesConPagos } from "@/lib/admin/pagos";
import { listarPedidos } from "@/lib/admin/pedidos";
import { cuando, porPestana, type PedidoPanel, vencidas } from "@/lib/admin/pedidos-panel";
import { fechaBA } from "@/lib/pedidos/reglas";
import { listarWorkshops } from "@/lib/admin/workshops";
import { requireAdminPage } from "@/lib/auth";
import { formatDay, formatPrice, formatTime } from "@/lib/format";

const content = admin.inicio;

export const metadata: Metadata = content.metadata;

const card = "flex flex-col gap-4 rounded-3xl border border-borde bg-white p-5 lg:p-6";
const link = "self-start py-2.5 text-15 font-semibold text-chocolate underline hover:text-carbon";

/** Los pedidos que esperan algo de Maggie, con la hora con la que se calcularon. */
async function cargar() {
  const session = await requireAdminPage("/admin");
  const [workshops, inscripciones, pedidos] = await Promise.all([
    listarWorkshops(session.supabase),
    listarInscripcionesConPagos(session.supabase),
    listarPedidos(session.supabase),
  ]);
  const now = Date.now();
  const grupos = porPestana(pedidos, now);
  const hoy = fechaBA(now);
  return {
    workshops,
    inscripciones,
    pedidos,
    porConfirmar: grupos.por_confirmar,
    transferencias: grupos.esperando_transferencia,
    transferenciasVencidas: vencidas(grupos.esperando_transferencia, now),
    deHoy: grupos.en_curso.filter((p) => p.fecha === hoy),
  };
}

/** Un pedido en una tarjeta del Inicio: nombre, número y turno, con link al detalle. */
function FilaPedido({ pedido }: { pedido: PedidoPanel }) {
  return (
    <li className="flex flex-col gap-0.5 border-b border-borde-suave pb-3 last:border-0">
      <Link href={`/admin/pedidos/${pedido.id}`} className="font-semibold text-carbon underline-offset-2 hover:underline">
        {pedido.nombre} · {admin.pedidos.number(pedido.numero)}
      </Link>
      <span className="text-14 text-secundario">{cuando(pedido)}</span>
    </li>
  );
}

/** Resumen: pedidos que esperan algo, próximos workshops, pendientes de pago y pagos para devolver. */
export default async function AdminInicio() {
  const { workshops, inscripciones, pedidos, porConfirmar, transferencias, transferenciasVencidas, deHoy } = await cargar();
  const ahora = new Date().toISOString();
  const proximos = workshops
    .filter((w) => w.active && w.startsAt > ahora)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 4);
  const pendientes = inscripciones.filter((i) => i.estado === "pendiente_sena" && !i.vencida);
  const devoluciones = armarDevoluciones(inscripciones, pedidos).filter((d) => !d.devueltoAt);
  const tarjetasPedidos = [
    { id: "inicio-por-confirmar", textos: content.toConfirm, lista: porConfirmar, tab: "por_confirmar", extra: null },
    {
      id: "inicio-transferencias",
      textos: content.transfers,
      lista: transferencias,
      tab: "esperando_transferencia",
      extra: transferenciasVencidas > 0 ? content.transfers.expired(transferenciasVencidas) : null,
    },
    { id: "inicio-hoy", textos: content.today, lista: deHoy, tab: "en_curso", extra: null },
  ];

  return (
    <PanelMain>
      <Encabezado eyebrow={admin.panel.subtitle} title={content.title} />
      <div className="grid gap-5 lg:grid-cols-3">
        {tarjetasPedidos.map(({ id, textos, lista, tab, extra }) => (
          <section key={id} aria-labelledby={id} className={card}>
            <h2 id={id} className="text-24">
              {textos.title}
            </h2>
            <p data-testid={`${id}-cantidad`} className="text-15 font-semibold">
              {content.count(lista.length)}
              {extra && <span className="font-medium text-error"> · {extra}</span>}
            </p>
            {lista.length === 0 ? (
              <EstadoVacio>{textos.empty}</EstadoVacio>
            ) : (
              <ul className="flex flex-col gap-3">
                {lista.slice(0, 3).map((pedido) => (
                  <FilaPedido key={pedido.id} pedido={pedido} />
                ))}
              </ul>
            )}
            <Link href={`/admin/pedidos?tab=${tab}`} className={link}>
              {textos.link}
            </Link>
          </section>
        ))}

        <section aria-labelledby="inicio-workshops" className={card}>
          <h2 id="inicio-workshops" className="text-24">
            {content.workshops.title}
          </h2>
          {proximos.length === 0 ? (
            <EstadoVacio>{content.workshops.empty}</EstadoVacio>
          ) : (
            <ul className="flex flex-col gap-3">
              {proximos.map((w) => (
                <li key={w.id} className="flex flex-col gap-0.5 border-b border-borde-suave pb-3 last:border-0">
                  <Link href={`/admin/workshops/${w.id}`} className="font-semibold text-carbon underline-offset-2 hover:underline">
                    {w.name}
                  </Link>
                  <span className="text-14 text-secundario">
                    {formatDay(w.startsAt)} · {formatTime(w.startsAt)}
                  </span>
                  <span className="text-14">{admin.workshops.spots(w.spotsTaken, w.capacity)}</span>
                  {w.spotsReserved < w.minimum && <span className="text-14 font-medium text-error">{admin.workshops.belowMinimum(w.minimum)}</span>}
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/workshops" className={link}>
            {content.workshops.link}
          </Link>
        </section>

        <section aria-labelledby="inicio-pendientes" className={card}>
          <h2 id="inicio-pendientes" className="text-24">
            {content.pending.title}
          </h2>
          <p className="text-14 text-secundario">{content.pending.text}</p>
          {pendientes.length === 0 ? (
            <EstadoVacio>{content.pending.empty}</EstadoVacio>
          ) : (
            <ul className="flex flex-col gap-3">
              {pendientes.slice(0, 6).map((i) => (
                <li key={i.id} className="flex flex-col gap-0.5 border-b border-borde-suave pb-3 last:border-0">
                  <strong>{i.nombre}</strong>
                  <span className="text-14 text-secundario">
                    {i.workshop} · {admin.pagos.columns.spots}: {i.cantidad}
                    {i.montoSena !== null && ` · ${formatPrice(i.montoSena)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/inscripciones?estado=pendiente_sena" className={link}>
            {content.pending.link}
          </Link>
        </section>

        <section aria-labelledby="inicio-devoluciones" className={card}>
          <h2 id="inicio-devoluciones" className="text-24">
            {content.refunds.title}
          </h2>
          {devoluciones.length === 0 ? (
            <EstadoVacio>{content.refunds.empty}</EstadoVacio>
          ) : (
            <ul className="flex flex-col gap-3">
              {devoluciones.map((d) => (
                <li key={d.clave} className="flex flex-col gap-0.5 border-b border-borde-suave pb-3 last:border-0">
                  <strong>{d.nombre}</strong>
                  <span className="text-14 text-secundario">
                    {formatPrice(d.monto)} · {d.concepto} · {admin.pagos.reasons[d.motivo ?? ""] ?? d.motivo}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/inscripciones#para-devolver" className={link}>
            {content.refunds.link}
          </Link>
        </section>
      </div>
    </PanelMain>
  );
}
