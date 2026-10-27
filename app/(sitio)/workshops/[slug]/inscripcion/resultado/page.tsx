import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { z } from "zod";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { RefrescoPendiente } from "@/components/inscripcion/RefrescoPendiente";
import { TituloConFoco } from "@/components/inscripcion/TituloConFoco";
import { pages, whatsappLink } from "@/data/site";
import { formatDay, formatPrice, formatTime } from "@/lib/format";
import { eventoIcs, icsHref } from "@/lib/ics";
import { ayudaPagoLink } from "@/lib/inscripcion-whatsapp";
import { resultadoInscripcion } from "@/lib/pagos/resultado";
import { vistaResultado } from "@/lib/pagos/vista";

const content = pages.inscripcionResultado;

export const metadata: Metadata = content.metadata;

// El estado del pago se lee en cada request (y se concilia con Mercado Pago).
export const dynamic = "force-dynamic";

/**
 * Adonde vuelve Mercado Pago (back_urls). Los query params de MP (status,
 * payment_id…) se ignoran: el estado sale de la base, del lado del servidor,
 * después de conciliar con la API de MP.
 */
export default async function ResultadoPage({ params, searchParams }: PageProps<"/workshops/[slug]/inscripcion/resultado">) {
  const { slug } = await params;
  const { inscripcion: id } = await searchParams;
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) notFound();

  const inscripcion = await resultadoInscripcion(parsedId.data);
  if (!inscripcion || inscripcion.workshop.slug !== slug) notFound();

  const vista = vistaResultado(inscripcion);
  const { workshop } = inscripcion;
  const inscripcionHref = `/workshops/${slug}/inscripcion`;
  const ayuda = (
    <Button href={ayudaPagoLink({ name: workshop.nombre, startsAt: workshop.fechaInicio })} target="_blank" rel="noopener noreferrer" variant="secondary">
      {content.help}
      <span className="sr-only">{content.helpContext}</span>
    </Button>
  );
  const volver = (
    <Button href={inscripcionHref} variant="secondary">
      {content.again}
    </Button>
  );

  let title: string;
  let body: ReactNode;
  switch (vista.tipo) {
    case "reservada": {
      title = content.reserved.title;
      const ics = eventoIcs({
        uid: inscripcion.id,
        titulo: `Workshop: ${workshop.nombre}`,
        inicio: workshop.fechaInicio,
        duracionMinutos: workshop.duracionMin,
        lugar: pages.inscripcion.summary.place,
      });
      body = (
        <>
          <p className="text-17 leading-parrafo">{content.reserved.text(formatDay(workshop.fechaInicio), formatTime(workshop.fechaInicio))}</p>
          <dl className="flex flex-col gap-2 rounded-2xl bg-arena p-5 text-15">
            <div className="flex justify-between gap-4">
              <dt className="text-secundario">{content.reserved.paid}</dt>
              <dd data-testid="resultado-total" className="font-semibold">
                {inscripcion.montoSena === null ? "—" : formatPrice(inscripcion.montoSena)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secundario">{pages.inscripcion.summary.spots}</dt>
              <dd>{content.reserved.spots(inscripcion.cantidad)}</dd>
            </div>
          </dl>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href={icsHref(ics)} download={content.reserved.calendarFile} size="lg">
              {content.reserved.calendar}
            </Button>
            <Button
              href={whatsappLink(content.reserved.whatsappMessage(workshop.nombre))}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="lg"
            >
              {content.reserved.whatsapp}
              <span className="sr-only">{content.helpContext}</span>
            </Button>
          </div>
        </>
      );
      break;
    }
    case "pendiente":
      title = content.pending.title;
      body = (
        <>
          <p className="text-17 leading-parrafo">{content.pending.text}</p>
          {vista.puedePagar && inscripcion.initPoint && (
            <>
              <p className="leading-parrafo">{content.pending.notPaid}</p>
              <Button href={inscripcion.initPoint} size="lg" className="self-start">
                {content.pending.pay}
              </Button>
            </>
          )}
          <RefrescoPendiente aviso={content.pending.timeout} />
          {ayuda}
        </>
      );
      break;
    case "rechazada":
      title = content.rejected.title;
      body = (
        <>
          <p className="text-17 leading-parrafo">{vista.vigente ? content.rejected.text : content.rejected.expired}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {vista.vigente && inscripcion.initPoint ? (
              <Button href={inscripcion.initPoint} size="lg">
                {content.rejected.retry}
              </Button>
            ) : (
              volver
            )}
            {ayuda}
          </div>
        </>
      );
      break;
    case "vencida":
      title = content.expired.title;
      body = (
        <>
          <p className="text-17 leading-parrafo">{content.expired.text}</p>
          {volver}
        </>
      );
      break;
    case "devolucion":
      title = content.refund.title;
      body = (
        <>
          <p className="text-17 leading-parrafo">{content.refund.text}</p>
          {ayuda}
        </>
      );
      break;
    case "cancelada":
      title = content.cancelled.title;
      body = (
        <>
          <p className="text-17 leading-parrafo">{content.cancelled.text}</p>
          {volver}
        </>
      );
      break;
  }

  return (
    <div className="contenedor flex max-w-180 flex-col items-start gap-5 pt-8 pb-16 lg:pt-14 lg:pb-26">
      <Eyebrow>{content.eyebrow(workshop.nombre)}</Eyebrow>
      {/* aria-live: cuando el refresco cambia el estado, el lector lo anuncia. */}
      <div aria-live="polite" className="flex w-full flex-col items-start gap-5">
        <TituloConFoco className="text-38 lg:text-56">{title}</TituloConFoco>
        {body}
      </div>
    </div>
  );
}
