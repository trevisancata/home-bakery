import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { z } from "zod";
import { Button } from "@/components/Button";
import { VaciarCarrito } from "@/components/carrito/VaciarCarrito";
import { Eyebrow } from "@/components/Eyebrow";
import { RefrescoPendiente } from "@/components/inscripcion/RefrescoPendiente";
import { TituloConFoco } from "@/components/inscripcion/TituloConFoco";
import { pages, pedidos, whatsappLink, whatsappMessages } from "@/data/site";
import { formatDay, formatPrice } from "@/lib/format";
import { resultadoPedido } from "@/lib/pagos/resultado-pedido";
import { vistaPedido } from "@/lib/pagos/vista";

const content = pages.pedidoResultado;

export const metadata: Metadata = content.metadata;

// El estado del pago se lee en cada request (y se concilia con Mercado Pago).
export const dynamic = "force-dynamic";

/**
 * Adonde vuelve Mercado Pago (back_urls) después de pagar un pedido. Los
 * query params de MP se ignoran: el estado sale de la base, del lado del
 * servidor, después de conciliar con la API de MP. Pagado no es confirmado:
 * Maggie acepta el pedido después.
 */
export default async function PedidoResultadoPage({ searchParams }: PageProps<"/pedido/resultado">) {
  const { pedido: id } = await searchParams;
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) notFound();

  const pedido = await resultadoPedido(parsedId.data);
  if (!pedido) notFound();

  const vista = vistaPedido(pedido);
  // La fecha es un día de Buenos Aires: al mediodía, para que ningún huso la corra.
  const dia = formatDay(`${pedido.fecha}T12:00:00-03:00`);
  const cuando = `${dia}, ${pages.checkout.when.slotLabel(pedido.franja)} · ${
    pedido.entrega === "envio" ? pedidos.entrega.envio.label : pedidos.entrega.retiro.label
  }`;
  const ayuda = (
    <Button href={whatsappLink(whatsappMessages.orderHelp(pedido.numero))} target="_blank" rel="noopener noreferrer" variant="secondary">
      {content.help}
      <span className="sr-only">{content.helpContext}</span>
    </Button>
  );
  const volver = (
    <Button href="/carrito" variant="secondary">
      {content.again}
    </Button>
  );

  let title: string;
  let body: ReactNode;
  switch (vista.tipo) {
    case "pagado":
      title = content.paid.title;
      body = (
        <>
          <VaciarCarrito />
          <p className="text-17 leading-parrafo">{content.paid.text}</p>
          <dl className="flex w-full flex-col gap-2 rounded-2xl bg-arena p-5 text-15">
            <div className="flex justify-between gap-4">
              <dt className="text-secundario">{content.paid.when}</dt>
              <dd className="text-right">{cuando}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secundario">{content.paid.total}</dt>
              <dd data-testid="resultado-total" className="font-semibold">
                {formatPrice(pedido.total)}
              </dd>
            </div>
          </dl>
          <Button
            href={whatsappLink(whatsappMessages.orderPaid(pedido.numero))}
            target="_blank"
            rel="noopener noreferrer"
            size="lg"
          >
            {content.paid.whatsapp}
            <span className="sr-only">{content.helpContext}</span>
          </Button>
        </>
      );
      break;
    case "pendiente":
      title = content.pending.title;
      body = (
        <>
          <p className="text-17 leading-parrafo">{content.pending.text}</p>
          {vista.puedePagar && pedido.initPoint && (
            <>
              <p className="leading-parrafo">{content.pending.notPaid}</p>
              <Button href={pedido.initPoint} size="lg" className="self-start">
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
            {vista.vigente && pedido.initPoint ? (
              <Button href={pedido.initPoint} size="lg">
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
      <Eyebrow>{content.eyebrow(pedido.numero)}</Eyebrow>
      {/* aria-live: cuando el refresco cambia el estado, el lector lo anuncia. */}
      <div aria-live="polite" className="flex w-full flex-col items-start gap-5">
        <TituloConFoco className="text-38 lg:text-56">{title}</TituloConFoco>
        {body}
      </div>
    </div>
  );
}
