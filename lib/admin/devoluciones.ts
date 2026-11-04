// "Para devolver" junta las devoluciones de workshops y de pedidos: los pagos
// de Mercado Pago (pagos) y los pagos de pedidos registrados a mano
// (pedidos.devolucion_pendiente, migración 0008). Se muestran en Inscripciones
// y en el Inicio.

import type { Devolucion } from "@/components/admin/inscripciones/Devoluciones";
import { admin } from "@/data/admin";
import type { InscripcionConPagos } from "@/lib/admin/pagos";
import type { PedidoPanel } from "@/lib/admin/pedidos-panel";

/** Pendientes y ya devueltas (las pendientes primero se filtran en cada pantalla). */
export function armarDevoluciones(inscripciones: InscripcionConPagos[], pedidos: PedidoPanel[]): Devolucion[] {
  const deInscripciones = inscripciones.flatMap((i) =>
    i.pagos
      .filter((p) => p.devolucionPendiente || p.devueltoAt)
      .map((p): Devolucion => ({
        clave: p.id,
        tipo: "mp",
        id: p.id,
        mpPaymentId: p.mpPaymentId,
        monto: p.monto,
        motivo: p.motivoDevolucion,
        nombre: i.nombre,
        concepto: i.workshop,
        href: null,
        devueltoAt: p.devueltoAt,
      })),
  );
  const dePedidos = pedidos.flatMap((pedido) => {
    const concepto = admin.pedidos.number(pedido.numero);
    const href = `/admin/pedidos/${pedido.id}`;
    const mp = pedido.pagos
      .filter((p) => p.devolucionPendiente || p.devueltoAt)
      .map((p): Devolucion => ({
        clave: p.id,
        tipo: "mp",
        id: p.id,
        mpPaymentId: p.mpPaymentId,
        monto: p.monto,
        motivo: p.motivoDevolucion,
        nombre: pedido.nombre,
        concepto,
        href,
        devueltoAt: p.devueltoAt,
      }));
    const manual: Devolucion[] =
      pedido.devolucionPendiente || pedido.devueltoAt
        ? [
            {
              clave: `pedido:${pedido.id}`,
              tipo: "manual",
              id: pedido.id,
              mpPaymentId: null,
              monto: pedido.total,
              motivo: pedido.estado === "cancelado" ? "pedido_cancelado" : "pedido_rechazado",
              nombre: pedido.nombre,
              concepto: `${concepto} · ${admin.pedidos.payment[pedido.medioPago]}`,
              href,
              devueltoAt: pedido.devueltoAt,
            },
          ]
        : [];
    return [...mp, ...manual];
  });
  return [...deInscripciones, ...dePedidos];
}
