import type { ReactNode } from "react";
import { admin } from "@/data/admin";
import type { InscripcionConPagos } from "@/lib/admin/pagos";
import { formatPrice } from "@/lib/format";

const content = admin.pagos;
const th = "border-b border-borde px-3 py-2.5 text-left text-13 font-semibold whitespace-nowrap text-secundario";
const td = "border-b border-borde-suave px-3 py-2.5 align-top text-14";

const fecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Argentina/Buenos_Aires",
});

/** Tabla con scroll horizontal accesible (se puede enfocar y recorrer con el teclado). */
function Scroll({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className="w-full overflow-x-auto rounded-2xl border border-borde bg-white">
      {children}
    </div>
  );
}

/**
 * Lista simple de inscripciones con su pago y de los pagos para devolver.
 * El panel completo llega en el próximo PR.
 */
export function InscripcionesPagos({ inscripciones }: { inscripciones: InscripcionConPagos[] }) {
  const devoluciones = inscripciones.flatMap((inscripcion) =>
    inscripcion.pagos.filter((pago) => pago.devolucionPendiente).map((pago) => ({ inscripcion, pago })),
  );

  return (
    <>
      <section aria-labelledby="devoluciones-titulo" className="flex w-full flex-col gap-3">
        <h2 id="devoluciones-titulo" className="text-26 lg:text-32">
          {content.refundsTitle}
        </h2>
        <p className="text-15 text-secundario">{content.refundsText}</p>
        {devoluciones.length === 0 ? (
          <p className="text-15">{content.refundsEmpty}</p>
        ) : (
          <Scroll label={content.refundsTitle}>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th scope="col" className={th}>{content.columns.date}</th>
                  <th scope="col" className={th}>{content.columns.workshop}</th>
                  <th scope="col" className={th}>{content.columns.name}</th>
                  <th scope="col" className={th}>{content.columns.amount}</th>
                  <th scope="col" className={th}>{content.columns.mpId}</th>
                  <th scope="col" className={th}>{content.columns.reason}</th>
                </tr>
              </thead>
              <tbody>
                {devoluciones.map(({ inscripcion, pago }) => (
                  <tr key={pago.mpPaymentId}>
                    <td className={td}>{fecha.format(new Date(pago.createdAt))}</td>
                    <td className={td}>{inscripcion.workshop}</td>
                    <td className={td}>{inscripcion.nombre}</td>
                    <td className={td}>{formatPrice(pago.monto)}</td>
                    <td className={`${td} font-mono`}>{pago.mpPaymentId}</td>
                    <td className={td}>{content.reasons[pago.motivoDevolucion ?? ""] ?? pago.motivoDevolucion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Scroll>
        )}
      </section>

      <section aria-labelledby="inscripciones-titulo" className="flex w-full flex-col gap-3">
        <h2 id="inscripciones-titulo" className="text-26 lg:text-32">
          {content.title}
        </h2>
        {inscripciones.length === 0 ? (
          <p className="text-15">{content.empty}</p>
        ) : (
          <Scroll label={content.title}>
            <table className="w-full border-collapse">
              <caption className="sr-only">{content.caption}</caption>
              <thead>
                <tr>
                  <th scope="col" className={th}>{content.columns.date}</th>
                  <th scope="col" className={th}>{content.columns.workshop}</th>
                  <th scope="col" className={th}>{content.columns.name}</th>
                  <th scope="col" className={th}>{content.columns.spots}</th>
                  <th scope="col" className={th}>{content.columns.status}</th>
                  <th scope="col" className={th}>{content.columns.deposit}</th>
                  <th scope="col" className={th}>{content.columns.payment}</th>
                  <th scope="col" className={th}>{content.columns.mpId}</th>
                </tr>
              </thead>
              <tbody>
                {inscripciones.map((inscripcion) => {
                  const [pago] = inscripcion.pagos;
                  return (
                    <tr key={inscripcion.id} data-testid={`inscripcion-${inscripcion.id}`}>
                      <td className={td}>{fecha.format(new Date(inscripcion.createdAt))}</td>
                      <td className={td}>{inscripcion.workshop}</td>
                      <td className={td}>{inscripcion.nombre}</td>
                      <td className={td}>{inscripcion.cantidad}</td>
                      <td className={td}>
                        {content.status[inscripcion.estado] ?? inscripcion.estado}
                        {inscripcion.vencida && <span className="text-secundario"> ({content.expired})</span>}
                      </td>
                      <td className={td}>{inscripcion.montoSena === null ? "—" : formatPrice(inscripcion.montoSena)}</td>
                      <td className={td}>
                        {pago ? `${content.paymentStatus[pago.estado] ?? pago.estado} · ${formatPrice(pago.monto)}` : content.noPayment}
                      </td>
                      <td className={`${td} font-mono`}>{pago?.mpPaymentId ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Scroll>
        )}
      </section>
    </>
  );
}
