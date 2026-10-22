"use client";

import { useId, useState, useTransition } from "react";
import { cambiarEstado } from "@/app/admin/(panel)/inscripciones/actions";
import { Aviso, useAviso } from "@/components/admin/ui/Aviso";
import { Icono } from "@/components/admin/ui/Icono";
import { admin } from "@/data/admin";
import { inscripcionStatuses } from "@/lib/admin/schemas";
import type { InscripcionConPagos } from "@/lib/admin/pagos";
import { formatPrice } from "@/lib/format";
import { waLink } from "@/lib/whatsapp-numero";

const content = admin.inscripciones;
const columnas = admin.workshops.inscriptas.columns;
const pagos = admin.pagos;

const fecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Argentina/Buenos_Aires",
});

/** Estado de una inscripción editable en el lugar, con su feedback. */
function EstadoEditable({ inscripcion, onCambio }: { inscripcion: InscripcionConPagos; onCambio: (texto: string, error?: boolean) => void }) {
  const [estado, setEstado] = useState(inscripcion.estado);
  const [guardando, startTransition] = useTransition();
  const id = useId();
  return (
    <div className="flex flex-col gap-0.5">
      <label htmlFor={id} className="sr-only">
        {content.statusLabel(inscripcion.nombre)}
      </label>
      <select
        id={id}
        value={estado}
        aria-busy={guardando || undefined}
        onChange={(event) => {
          const anterior = estado;
          const nuevo = event.target.value;
          setEstado(nuevo);
          startTransition(async () => {
            const resultado = await cambiarEstado(inscripcion.id, nuevo);
            if (resultado.ok) onCambio(content.statusSaved(inscripcion.nombre));
            else {
              setEstado(anterior);
              onCambio(resultado.message, true);
            }
          });
        }}
        className="h-11 rounded-lg border border-borde-control bg-white px-2 text-14"
      >
        {inscripcionStatuses.map((s) => (
          <option key={s} value={s}>
            {pagos.status[s]}
          </option>
        ))}
      </select>
      {inscripcion.vencida && estado === "pendiente_sena" && <span className="text-12 text-secundario">{pagos.expired}</span>}
    </div>
  );
}

function Pago({ inscripcion }: { inscripcion: InscripcionConPagos }) {
  const [pago] = inscripcion.pagos;
  if (!pago) {
    return (
      <span className="text-14 text-secundario">
        {pagos.noPayment}
        {inscripcion.montoSena !== null && ` · ${formatPrice(inscripcion.montoSena)}`}
      </span>
    );
  }
  return (
    <span className="flex flex-col text-14">
      <span>
        {pagos.paymentStatus[pago.estado] ?? pago.estado} · {formatPrice(pago.monto)}
      </span>
      <span className="font-mono text-12 text-secundario">{pago.mpPaymentId}</span>
    </span>
  );
}

function WhatsApp({ inscripcion }: { inscripcion: InscripcionConPagos }) {
  return (
    <a
      href={waLink(inscripcion.whatsapp, content.whatsappMessage(inscripcion.nombre, inscripcion.workshop))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={content.whatsapp(inscripcion.nombre)}
      className="inline-flex size-11 items-center justify-center rounded-full text-abierto hover:bg-arena"
    >
      <Icono nombre="whatsapp" />
    </a>
  );
}

/**
 * Inscripciones con estado editable, pago (estado, monto e id de MP) y
 * WhatsApp. Tabla en desktop y tarjetas en mobile.
 */
export function TablaInscripciones({ inscripciones, conWorkshop }: { inscripciones: InscripcionConPagos[]; conWorkshop: boolean }) {
  const { aviso, avisar, cerrar } = useAviso();
  const onCambio = (texto: string, error = false) => avisar({ texto, tipo: error ? "error" : "exito" });
  const th = "px-3 py-3 text-left text-13 font-semibold text-chocolate";
  const td = "border-t border-borde px-3 py-3 align-top text-14";

  return (
    <>
      <div className="hidden overflow-x-auto rounded-3xl border border-borde bg-white lg:block">
        <table className="w-full border-collapse">
          <thead className="bg-arena">
            <tr>
              <th scope="col" className={th}>{pagos.columns.date}</th>
              {conWorkshop && <th scope="col" className={th}>{pagos.columns.workshop}</th>}
              <th scope="col" className={th}>{columnas.name}</th>
              <th scope="col" className={th}>{columnas.spots}</th>
              <th scope="col" className={th}>{columnas.status}</th>
              <th scope="col" className={th}>{columnas.payment}</th>
              <th scope="col" className={th}>{columnas.experience}</th>
              <th scope="col" className={th}>{columnas.allergies}</th>
              <th scope="col" className={th}>{columnas.referral}</th>
              <th scope="col" className={th}>{columnas.whatsapp}</th>
            </tr>
          </thead>
          <tbody>
            {inscripciones.map((i) => (
              <tr key={i.id} data-testid={`inscripcion-${i.id}`}>
                <td className={td}>{fecha.format(new Date(i.createdAt))}</td>
                {conWorkshop && <td className={td}>{i.workshop}</td>}
                <td className={td}>
                  <strong>{i.nombre}</strong>
                  <span className="block text-12 break-all text-secundario">{i.email}</span>
                </td>
                <td className={td}>{i.cantidad}</td>
                <td className={td}>
                  <EstadoEditable inscripcion={i} onCambio={onCambio} />
                </td>
                <td className={td}>
                  <Pago inscripcion={i} />
                </td>
                <td className={td}>{i.experiencia ?? "—"}</td>
                <td className={td}>{i.alergias ?? "—"}</td>
                <td className={td}>{i.comoNosConocio ?? "—"}</td>
                <td className={td}>
                  <WhatsApp inscripcion={i} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 lg:hidden">
        {inscripciones.map((i) => (
          <li key={i.id} className="flex flex-col gap-2 rounded-2xl border border-borde bg-white p-4 text-14">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <strong className="text-15">{i.nombre}</strong>
                <span className="text-13 text-secundario">
                  {conWorkshop && `${i.workshop} · `}
                  {fecha.format(new Date(i.createdAt))} · {columnas.spots}: {i.cantidad}
                </span>
              </div>
              <WhatsApp inscripcion={i} />
            </div>
            <EstadoEditable inscripcion={i} onCambio={onCambio} />
            <Pago inscripcion={i} />
            {(i.experiencia || i.alergias) && (
              <span className="text-13 text-secundario">
                {[i.experiencia && `${columnas.experience}: ${i.experiencia}`, i.alergias && `${columnas.allergies}: ${i.alergias}`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
          </li>
        ))}
      </ul>
      <Aviso aviso={aviso} onClose={cerrar} />
    </>
  );
}
