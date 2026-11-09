"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { aceptar, avanzar, cancelar, marcarDevuelto, marcarPagado, rechazar } from "@/app/admin/(panel)/pedidos/actions";
import { Aviso, useAviso } from "@/components/admin/ui/Aviso";
import { CampoArea } from "@/components/admin/ui/Campos";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { admin } from "@/data/admin";
import { enCurso, type PedidoPanel } from "@/lib/admin/pedidos-panel";

const content = admin.pedidos;
const a = content.actions;

type Dialogo = "rechazar" | "cancelar" | "pagar" | "entregar" | null;

const primario = "min-h-12 rounded-full bg-chocolate px-5 font-semibold text-hueso hover:bg-carbon disabled:opacity-60";
const secundario = "min-h-12 rounded-full border-trazo border-carbon px-5 font-semibold text-carbon hover:bg-arena disabled:opacity-60";
const peligro = "min-h-12 rounded-full border-trazo border-error px-5 font-semibold text-error hover:bg-error-fondo disabled:opacity-60";

/**
 * Lo que se puede hacer con un pedido según su estado y su medio de pago. Las
 * funciones de la base vuelven a validar todo: si dos pestañas actúan a la
 * vez, la segunda recibe el error y lo ve en el aviso.
 * Después de cada acción: el aviso (aria-live) y el foco en el estado del
 * pedido, que se vuelve a leer del servidor (router.refresh).
 */
export function AccionesPedido({
  pedido,
  vencida,
  avisoWhatsApp,
  avisoListo,
}: {
  pedido: PedidoPanel;
  /** Pendiente de pago con el plazo vencido (calculado en el servidor). */
  vencida: boolean;
  avisoWhatsApp: string | null;
  /** En curso: el aviso de que está listo (solo abre WhatsApp, no cambia el estado). */
  avisoListo: string | null;
}) {
  const router = useRouter();
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [motivo, setMotivo] = useState("");
  const [errorMotivo, setErrorMotivo] = useState<string | undefined>();
  const [pendiente, startTransition] = useTransition();
  const { aviso, avisar, cerrar } = useAviso();
  const motivoRef = useRef<HTMLDivElement>(null);

  const { estado, medioPago } = pedido;
  const sinCobrar = medioPago === "efectivo" && !pedido.pagadoAt;
  const puedeAceptar = estado === "pagado" || (medioPago === "efectivo" && estado === "pendiente_pago");
  const puedeRechazar = estado === "pagado" || estado === "pendiente_pago";
  const puedePagar =
    medioPago !== "mercadopago" &&
    !pedido.pagadoAt &&
    (medioPago === "transferencia" ? estado === "pendiente_pago" : !["rechazado", "cancelado", "entregado"].includes(estado));
  // En curso (aceptado, o en_preparacion/listo de antes de 0011): se entrega o se cancela.
  const puedeEntregar = enCurso.has(estado);
  const puedeCancelar = enCurso.has(estado);
  const transferenciaVencida = medioPago === "transferencia" && vencida;

  function abrir(d: Dialogo) {
    setMotivo("");
    setErrorMotivo(undefined);
    setDialogo(d);
  }

  /** Corre la acción, avisa y lleva el foco al estado del pedido. */
  function ejecutar(fn: () => Promise<{ ok: boolean; message?: string }>, exito: (r: unknown) => string) {
    startTransition(async () => {
      const resultado = await fn();
      if (!resultado.ok) {
        avisar({ texto: resultado.message ?? admin.ui.error, tipo: "error" });
        return;
      }
      setDialogo(null);
      avisar({ texto: exito(resultado) });
      router.refresh();
      document.getElementById("pedido-estado")?.focus();
    });
  }

  function anular() {
    const texto = motivo.trim();
    if (texto.length < 3) {
      setErrorMotivo(a.reasonRequired);
      motivoRef.current?.querySelector("textarea")?.focus();
      return;
    }
    const tipo = dialogo;
    ejecutar(
      () => (tipo === "rechazar" ? rechazar(pedido.id, texto) : cancelar(pedido.id, texto)),
      (r) => {
        const base = tipo === "rechazar" ? a.rejected(pedido.numero) : a.cancelled(pedido.numero);
        const devolucion = (r as { data?: { quedaDevolucion?: boolean } }).data?.quedaDevolucion;
        return devolucion ? `${base} ${a.refundNotice}` : base;
      },
    );
  }

  function entregar() {
    ejecutar(
      () => avanzar(pedido.id, "entregado", sinCobrar),
      () => a.advanced(pedido.numero, content.status.entregado),
    );
  }

  const hayAcciones =
    puedeAceptar || puedeRechazar || puedePagar || puedeEntregar || puedeCancelar || pedido.devolucionPendiente || avisoWhatsApp || avisoListo;
  const enlaceWhatsApp = `${secundario} inline-flex items-center justify-center no-underline`;

  return (
    <section aria-labelledby="pedido-acciones" className="flex flex-col gap-3 rounded-3xl border border-borde bg-white p-5 lg:p-6">
      <h2 id="pedido-acciones" className="text-24">
        {a.title}
      </h2>
      {!hayAcciones && <p className="text-15 text-secundario">{a.none}</p>}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {puedePagar && (
          <button type="button" disabled={pendiente} onClick={() => abrir("pagar")} className={puedeAceptar ? secundario : primario}>
            {a.markPaid[medioPago]}
          </button>
        )}
        {puedeAceptar && (
          <button
            type="button"
            disabled={pendiente}
            onClick={() => ejecutar(() => aceptar(pedido.id), () => a.accepted(pedido.numero))}
            className={primario}
          >
            {a.accept}
          </button>
        )}
        {puedeEntregar && (
          <button type="button" disabled={pendiente} onClick={() => abrir("entregar")} className={primario}>
            {sinCobrar ? a.advance.entregadoCobrado : a.advance.entregado}
          </button>
        )}
        {pedido.devolucionPendiente && (
          <button
            type="button"
            disabled={pendiente}
            onClick={() => ejecutar(() => marcarDevuelto(pedido.id), () => a.refundDone)}
            className={primario}
          >
            {a.refund}
          </button>
        )}
        {avisoListo && (
          <a href={avisoListo} target="_blank" rel="noopener noreferrer" className={enlaceWhatsApp}>
            {a.notifyReady}
            <span className="sr-only">{a.notifyContext(pedido.nombre.split(" ")[0])}</span>
          </a>
        )}
        {avisoWhatsApp && (
          <a href={avisoWhatsApp} target="_blank" rel="noopener noreferrer" className={enlaceWhatsApp}>
            {enCurso.has(estado) ? a.notifyConfirmed : a.notify}
            <span className="sr-only">{a.notifyContext(pedido.nombre.split(" ")[0])}</span>
          </a>
        )}
        {puedeRechazar && (
          <button type="button" disabled={pendiente} onClick={() => abrir("rechazar")} className={peligro}>
            {a.reject}
          </button>
        )}
        {puedeCancelar && (
          <button type="button" disabled={pendiente} onClick={() => abrir("cancelar")} className={peligro}>
            {a.cancel}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={dialogo === "rechazar" || dialogo === "cancelar"}
        title={dialogo === "cancelar" ? a.cancelDialog.title : a.rejectDialog.title}
        onClose={() => setDialogo(null)}
        actions={
          <>
            <button type="button" data-autofocus onClick={() => setDialogo(null)} className={secundario}>
              {a.back}
            </button>
            <button type="button" disabled={pendiente} onClick={anular} className="min-h-12 rounded-full bg-error px-5 font-semibold text-white disabled:opacity-60">
              {dialogo === "cancelar" ? a.cancelDialog.confirm : a.rejectDialog.confirm}
            </button>
          </>
        }
      >
        <div ref={motivoRef} className="flex flex-col gap-4">
          <p>{dialogo === "cancelar" ? a.cancelDialog.text : a.rejectDialog.text}</p>
          <CampoArea
            label={`${a.reason} *`}
            campo="reason"
            rows={3}
            maxLength={500}
            value={motivo}
            error={errorMotivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              if (errorMotivo && e.target.value.trim().length >= 3) setErrorMotivo(undefined);
            }}
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={dialogo === "pagar"}
        title={a.markPaidDialog.title}
        onClose={() => setDialogo(null)}
        actions={
          <>
            <button type="button" data-autofocus onClick={() => setDialogo(null)} className={secundario}>
              {a.markPaidDialog.cancel}
            </button>
            <button
              type="button"
              disabled={pendiente}
              onClick={() => ejecutar(() => marcarPagado(pedido.id), () => a.paid(pedido.numero))}
              className={primario}
            >
              {a.markPaidDialog.confirm}
            </button>
          </>
        }
      >
        <p>{medioPago === "efectivo" ? a.markPaidDialog.efectivo : a.markPaidDialog.transferencia}</p>
        {transferenciaVencida && <p className="mt-3 font-semibold text-error">{a.markPaidDialog.expired}</p>}
      </ConfirmDialog>

      <ConfirmDialog
        open={dialogo === "entregar"}
        title={a.deliverDialog.title}
        onClose={() => setDialogo(null)}
        actions={
          <>
            <button type="button" data-autofocus onClick={() => setDialogo(null)} className={secundario}>
              {a.deliverDialog.cancel}
            </button>
            <button type="button" disabled={pendiente} onClick={entregar} className={primario}>
              {sinCobrar ? a.advance.entregadoCobrado : a.deliverDialog.confirm}
            </button>
          </>
        }
      >
        <p>{sinCobrar ? a.deliverDialog.cash : a.deliverDialog.text}</p>
      </ConfirmDialog>

      <Aviso aviso={aviso} onClose={cerrar} />
    </section>
  );
}
