"use client";

import { useState, useTransition } from "react";
import { marcarDevuelto } from "@/app/admin/(panel)/inscripciones/actions";
import { Aviso, useAviso } from "@/components/admin/ui/Aviso";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { EstadoVacio } from "@/components/admin/ui/EstadoVacio";
import { admin } from "@/data/admin";
import { formatDay, formatPrice } from "@/lib/format";

const content = admin.inscripciones;
const pagos = admin.pagos;

export type Devolucion = {
  pagoId: string;
  mpPaymentId: string;
  monto: number;
  motivo: string | null;
  nombre: string;
  workshop: string;
  devueltoAt: string | null;
};

/** "Para devolver" con "Marcar como devuelto" (con confirmación) y, abajo, los ya devueltos. */
export function Devoluciones({ iniciales }: { iniciales: Devolucion[] }) {
  const [lista, setLista] = useState(iniciales);
  const [aMarcar, setAMarcar] = useState<Devolucion | null>(null);
  const [, startTransition] = useTransition();
  const { aviso, avisar, cerrar } = useAviso();
  const pendientes = lista.filter((d) => !d.devueltoAt);
  const devueltas = lista.filter((d) => d.devueltoAt);

  function confirmar() {
    const d = aMarcar;
    setAMarcar(null);
    if (!d) return;
    startTransition(async () => {
      const resultado = await marcarDevuelto(d.pagoId);
      if (!resultado.ok) {
        avisar({ texto: resultado.message, tipo: "error" });
        return;
      }
      setLista((actual) => actual.map((x) => (x.pagoId === d.pagoId ? { ...x, devueltoAt: resultado.data.devueltoAt } : x)));
      avisar({ texto: content.refunded });
    });
  }

  return (
    <section id="para-devolver" aria-labelledby="devoluciones-titulo" className="flex scroll-mt-20 flex-col gap-3">
      <h2 id="devoluciones-titulo" className="text-26 lg:text-32">
        {pagos.refundsTitle}
      </h2>
      <p className="text-15 text-secundario">{pagos.refundsText}</p>
      {pendientes.length === 0 ? (
        <EstadoVacio>{pagos.refundsEmpty}</EstadoVacio>
      ) : (
        <ul className="flex flex-col gap-3">
          {pendientes.map((d) => (
            <li key={d.pagoId} data-testid={`devolucion-${d.mpPaymentId}`} className="flex flex-col gap-3 rounded-2xl border border-borde bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-0.5 text-14">
                <strong className="text-15">
                  {d.nombre} · {formatPrice(d.monto)}
                </strong>
                <span className="text-secundario">
                  {d.workshop} · {pagos.reasons[d.motivo ?? ""] ?? d.motivo}
                </span>
                <span className="font-mono text-12 text-secundario">
                  {pagos.columns.mpId}: {d.mpPaymentId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAMarcar(d)}
                aria-label={content.markRefundedLabel(d.nombre)}
                className="min-h-11 shrink-0 rounded-full bg-chocolate px-5 text-14 font-semibold text-hueso"
              >
                {content.markRefunded}
              </button>
            </li>
          ))}
        </ul>
      )}

      {devueltas.length > 0 && (
        <>
          <h3 className="mt-2 text-20">{content.refundedTitle}</h3>
          <ul className="flex flex-col gap-2 text-14">
            {devueltas.map((d) => (
              <li key={d.pagoId} className="flex flex-col rounded-xl bg-white px-4 py-2.5">
                <span>
                  {d.nombre} · {formatPrice(d.monto)} · {d.workshop}
                </span>
                <span className="text-12 text-secundario">{content.refundedAt(formatDay(d.devueltoAt!))}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={aMarcar !== null}
        title={content.refundDialog.title}
        onClose={() => setAMarcar(null)}
        actions={
          <>
            <button type="button" data-autofocus onClick={() => setAMarcar(null)} className="min-h-12 rounded-full border-trazo border-carbon px-5 font-semibold">
              {content.refundDialog.cancel}
            </button>
            <button type="button" onClick={confirmar} className="min-h-12 rounded-full bg-chocolate px-5 font-semibold text-hueso">
              {content.refundDialog.confirm}
            </button>
          </>
        }
      >
        {content.refundDialog.text}
      </ConfirmDialog>
      <Aviso aviso={aviso} onClose={cerrar} />
    </section>
  );
}
