import Link from "next/link";
import { admin } from "@/data/admin";
import { cuando, entregaDe, estadoDelPago, type PedidoPanel, vencido } from "@/lib/admin/pedidos-panel";
import { formatPrice } from "@/lib/format";

const content = admin.pedidos;

/** Colores del estado (contrastes en app/globals.css): verde avanza, rojo terminó mal, arena espera. */
export function claseEstado(pedido: PedidoPanel, now = Date.now()) {
  if (pedido.estado === "rechazado" || pedido.estado === "cancelado" || vencido(pedido, now)) return "bg-error-fondo text-error";
  if (pedido.estado === "entregado" || pedido.estado === "listo" || pedido.estado === "en_preparacion" || pedido.estado === "aceptado") {
    return "bg-exito-fondo text-exito";
  }
  return "bg-arena text-chocolate";
}

/** Etiqueta del estado: "Vencida" para una transferencia o un MP que no se pagó a tiempo. */
export function etiquetaEstado(pedido: PedidoPanel, now = Date.now()) {
  return vencido(pedido, now) ? content.expired : content.status[pedido.estado] ?? pedido.estado;
}

/**
 * Tarjeta de la lista: toda la tarjeta lleva al detalle. El nombre del link
 * es todo su texto, empezando por la clienta y el número (sin aria-label, que
 * no incluiría lo visible: WCAG 2.5.3).
 */
export function TarjetaPedido({ pedido, now }: { pedido: PedidoPanel; now: number }) {
  return (
    <li data-testid={`pedido-${pedido.numero}`}>
      <Link
        href={`/admin/pedidos/${pedido.id}`}
        className="flex flex-col gap-2 rounded-2xl border border-borde bg-white p-4 text-carbon no-underline hover:border-chocolate"
      >
        <span className="flex items-start justify-between gap-3">
          <span className="flex flex-col">
            <strong className="text-17">{pedido.nombre}</strong>
            <span className="text-13 text-secundario">{content.number(pedido.numero)}</span>
          </span>
          <span className={`shrink-0 rounded-full px-3 py-1 text-13 font-semibold ${claseEstado(pedido, now)}`}>
            {etiquetaEstado(pedido, now)}
          </span>
        </span>
        <span className="text-15 font-medium">{cuando(pedido)}</span>
        <span className="text-14 text-secundario">{entregaDe(pedido)}</span>
        <span className="text-14">{estadoDelPago(pedido, now)}</span>
        <span className="flex items-baseline justify-between gap-3 border-t border-borde-suave pt-2 text-14">
          <span className="text-secundario">{content.products(pedido.unidades)}</span>
          <strong className="text-16">{formatPrice(pedido.total)}</strong>
        </span>
      </Link>
    </li>
  );
}
