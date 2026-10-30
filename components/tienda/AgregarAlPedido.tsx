"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { Cantidad } from "@/components/carrito/Cantidad";
import { useCarrito } from "@/components/carrito/CarritoProvider";
import { pages, ui } from "@/data/site";
import type { Product } from "@/lib/data";
import { formatPrice } from "@/lib/format";

const text = pages.tienda.product.order;

const selectClasses =
  "h-12 rounded-xl border bg-white px-3.5 text-15 font-normal text-carbon aria-invalid:border-error aria-invalid:border-2";

/**
 * Elegir tamaño, sabor y decoración y sumarlo al carrito. Solo para
 * productos que se pueden pedir (activos, en temporada, no a medida, con
 * algún tamaño con precio): el detalle decide antes cuándo mostrarlo. Los
 * tamaños "Precio a confirmar" se ven pero no se pueden elegir.
 */
export function AgregarAlPedido({ product }: { product: Product }) {
  const { add, announce } = useCarrito();
  const id = useId();
  const conPrecio = product.sizes.filter((size) => size.price !== null);
  const [sizeId, setSizeId] = useState(conPrecio[0]?.id ?? "");
  const [flavor, setFlavor] = useState("");
  const [decoration, setDecoration] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [flavorError, setFlavorError] = useState(false);
  const [added, setAdded] = useState(false);

  const size = conPrecio.find((s) => s.id === sizeId);
  const hasFlavors = product.flavors.length > 0;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!size || size.price === null) return;
    if (hasFlavors && !flavor) {
      setFlavorError(true);
      document.getElementById(`${id}-sabor`)?.focus();
      return;
    }
    const [image] = product.images;
    add({
      productId: product.id,
      slug: product.slug,
      sizeId: size.id,
      name: product.name,
      sizeLabel: size.label,
      flavor: flavor || null,
      decoration: decoration || null,
      quantity,
      unitPrice: size.price,
      leadTimeHours: product.leadTimeHours,
      image: image ? { src: image.src, alt: image.alt } : null,
    });
    announce(ui.cart.added(product.name));
    setAdded(true);
    setQuantity(1);
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-labelledby={`${id}-titulo`} className="flex flex-col gap-5 rounded-card border border-borde bg-white p-5 lg:p-6">
      <h2 id={`${id}-titulo`} className="font-label text-14 tracking-eyebrow text-chocolate uppercase">
        {text.label}
      </h2>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">{text.size}</legend>
        {product.sizes.map((s) => (
          <label
            key={s.id}
            className={`flex min-h-11 items-center justify-between gap-4 rounded-xl border px-3.5 py-2 ${
              s.price === null ? "border-borde text-secundario" : "cursor-pointer border-borde-control has-checked:border-chocolate has-checked:bg-arena"
            }`}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name={`${id}-tamano`}
                value={s.id}
                checked={sizeId === s.id}
                disabled={s.price === null}
                onChange={() => setSizeId(s.id)}
                className="size-4 accent-chocolate"
              />
              {s.label}
            </span>
            <span className="font-semibold">{s.price === null ? ui.priceTbd : formatPrice(s.price)}</span>
          </label>
        ))}
        {product.sizes.some((s) => s.price === null) && <p className="text-13 text-secundario">{text.priceTbdNote}</p>}
      </fieldset>

      {hasFlavors && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-sabor`} className="font-semibold">
            {text.flavor} *
          </label>
          <select
            id={`${id}-sabor`}
            value={flavor}
            required
            aria-invalid={flavorError || undefined}
            aria-describedby={flavorError ? `${id}-sabor-error` : undefined}
            onChange={(event) => {
              setFlavor(event.target.value);
              setFlavorError(false);
            }}
            className={`${selectClasses} ${flavorError ? "" : "border-borde-control"}`}
          >
            <option value="">{text.flavorPlaceholder}</option>
            {product.flavors.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          {flavorError && (
            <p id={`${id}-sabor-error`} className="text-13 font-medium text-error">
              {text.flavorRequired}
            </p>
          )}
        </div>
      )}

      {product.decorations.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-deco`} className="font-semibold">
            {text.decoration}
          </label>
          <select
            id={`${id}-deco`}
            value={decoration}
            onChange={(event) => setDecoration(event.target.value)}
            className={`${selectClasses} border-borde-control`}
          >
            <option value="">{text.noDecoration}</option>
            {product.decorations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span id={`${id}-cantidad`} className="font-semibold">
          {text.quantity}
        </span>
        <Cantidad
          value={quantity}
          onChange={setQuantity}
          labelledBy={`${id}-cantidad`}
          lessLabel={text.less}
          moreLabel={text.more}
          valueText={String(quantity)}
        />
      </div>

      <Button type="submit" size="lg" className="sm:self-start">
        {text.add}
        {size?.price != null && <span>· {formatPrice(size.price * quantity)}</span>}
      </Button>

      {/* El aviso lo lee la región aria-live del header; acá queda visible con el link. */}
      {added && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-15 font-semibold text-chocolate">
          {text.added}
          <Link href={ui.cart.href} className="text-carbon underline hover:text-chocolate">
            {text.viewCart}
          </Link>
        </p>
      )}
    </form>
  );
}
