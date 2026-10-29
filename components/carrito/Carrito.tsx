"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import { Cantidad } from "@/components/carrito/Cantidad";
import { useCarrito } from "@/components/carrito/CarritoProvider";
import { disponible, useRevision, type EstadoLinea } from "@/components/carrito/useRevision";
import { ImageFrame } from "@/components/ImageFrame";
import { pages, ui } from "@/data/site";
import { claveLinea, totalCarrito, type Linea } from "@/lib/carrito/lineas";
import { formatPrice } from "@/lib/format";

const content = pages.carrito;

function Aviso({ estado }: { estado: EstadoLinea | undefined }) {
  if (!estado || estado.tipo === "ok") return null;
  return (
    <p role="status" className="rounded-xl bg-arena px-3 py-2 text-14 font-semibold text-chocolate">
      {estado.tipo === "no_disponible" ? content.unavailable : content.priceChanged(formatPrice(estado.antes), formatPrice(estado.ahora))}
    </p>
  );
}

/** El carrito: líneas editables, avisos de disponibilidad y precio, y el total. */
export function Carrito() {
  const { lines, ready, setQuantity, remove } = useCarrito();
  const revision = useRevision();

  // Hasta leer localStorage no se sabe si está vacío: no se muestra "vacío" de más.
  if (!ready) return <p className="text-secundario">{content.checking}</p>;

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-17">{content.empty.text}</p>
        <Button href="/tienda">{content.empty.cta}</Button>
      </div>
    );
  }

  const disponibles = lines.filter((linea) => disponible(revision, linea));
  const hayNoDisponibles = disponibles.length < lines.length;
  const total = totalCarrito(disponibles);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-14">
      <section aria-label={content.linesLabel} className="flex flex-col gap-4">
        {revision.estado === "revisando" && <p className="text-14 text-secundario">{content.checking}</p>}
        {revision.estado === "error" && <p className="text-14 text-secundario">{content.checkError}</p>}
        <ul className="flex flex-col divide-y divide-borde border-y border-borde">
          {lines.map((linea) => (
            <LineaCarrito
              key={claveLinea(linea)}
              linea={linea}
              estado={revision.estado === "lista" ? revision.lineas[claveLinea(linea)] : undefined}
              onQuantity={(q) => setQuantity(claveLinea(linea), q)}
              onRemove={() => remove(claveLinea(linea))}
            />
          ))}
        </ul>
        <Link href="/tienda" className="self-start py-2.5 font-semibold text-chocolate underline hover:text-carbon">
          {content.keepShopping}
        </Link>
      </section>

      <aside className="flex flex-col gap-4 rounded-3xl border border-borde bg-white p-5 lg:sticky lg:top-34 lg:p-8">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-17 font-semibold">{content.total}</span>
          <span data-testid="carrito-total" className="text-26 font-semibold">
            {formatPrice(total)}
          </span>
        </div>
        {hayNoDisponibles && <p className="text-14 font-semibold text-error">{content.fixFirst}</p>}
        {hayNoDisponibles ? (
          <Button size="lg" disabled>
            {content.continue}
          </Button>
        ) : (
          <Button href="/carrito/checkout" size="lg">
            {content.continue}
          </Button>
        )}
      </aside>
    </div>
  );
}

function LineaCarrito({
  linea,
  estado,
  onQuantity,
  onRemove,
}: {
  linea: Linea;
  estado: EstadoLinea | undefined;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const id = `linea-${claveLinea(linea).replace(/[^a-z0-9]/gi, "")}`;
  const noDisponible = estado?.tipo === "no_disponible";
  return (
    <li className="flex gap-4 py-4" data-testid="carrito-linea">
      <ImageFrame
        src={linea.image?.src}
        alt={linea.image?.alt ?? ""}
        placeholderLabel={ui.imagePending}
        sizes="96px"
        rounded="rounded-xl"
        className="aspect-4/5 w-20 shrink-0 lg:w-24"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id={`${id}-nombre`} className="text-19 lg:text-21">
            <Link href={`/tienda/${linea.slug}`} className="no-underline hover:text-chocolate">
              {linea.name}
            </Link>
          </h2>
          <span className={`font-semibold ${noDisponible ? "text-secundario line-through" : ""}`}>
            {formatPrice(linea.unitPrice * linea.quantity)}
          </span>
        </div>
        <p className="text-14 text-secundario">
          {[linea.sizeLabel, linea.flavor && content.flavor(linea.flavor), linea.decoration && content.decoration(linea.decoration), content.unitPrice(formatPrice(linea.unitPrice))]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <Aviso estado={estado} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Cantidad
            value={linea.quantity}
            onChange={onQuantity}
            labelledBy={`${id}-nombre`}
            lessLabel={content.less(linea.name)}
            moreLabel={content.more(linea.name)}
            valueText={content.quantity(linea.name) + `: ${linea.quantity}`}
            disabled={noDisponible}
          />
          <button type="button" onClick={onRemove} className="min-h-11 px-2 font-semibold text-chocolate underline hover:text-carbon">
            {content.remove}
            <span className="sr-only">{content.removeContext(linea.name)}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
