"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/Button";
import { useCarrito } from "@/components/carrito/CarritoProvider";
import { disponible, useRevision } from "@/components/carrito/useRevision";
import { pages, pedidos, whatsappLink, whatsappMessages } from "@/data/site";
import { claveLinea, totalCarrito } from "@/lib/carrito/lineas";
import { formatPrice } from "@/lib/format";
import {
  anticipacionDe,
  fechaMaxima,
  fechaMinima,
  franjasDelDia,
  franjasDisponibles,
  puedeEnvio,
  validarFechaFranja,
} from "@/lib/pedidos/reglas";
import { pedidoFieldErrors, pedidoSchema, type PedidoField, type PedidoFieldErrors } from "@/lib/validation/pedido";

const content = pages.checkout;

type Values = {
  name: string;
  email: string;
  phone: string;
  delivery: "retiro" | "envio";
  address: string;
  locality: string;
  date: string;
  slot: string;
  notes: string;
};

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "error"; message: string; retry: boolean };

const initialValues: Values = {
  name: "",
  email: "",
  phone: "",
  delivery: "retiro",
  address: "",
  locality: "",
  date: "",
  slot: "",
  notes: "",
};

/** Orden de los campos en pantalla: el foco va al primero con error. */
const fieldOrder: PedidoField[] = ["items", "name", "email", "phone", "delivery", "address", "locality", "date", "slot", "notes"];

const ids: Record<PedidoField, string> = {
  items: "pedido-items",
  name: "pedido-nombre",
  email: "pedido-email",
  phone: "pedido-telefono",
  delivery: "pedido-entrega",
  address: "pedido-direccion",
  locality: "pedido-localidad",
  date: "pedido-fecha",
  slot: "pedido-franja",
  notes: "pedido-notas",
};

const inputClasses =
  "h-12 rounded-xl border bg-white px-3.5 text-15 font-normal text-carbon placeholder:text-secundario aria-invalid:border-error aria-invalid:border-2";

/**
 * Checkout del pedido: datos, entrega, día y horario, notas y resumen. Valida
 * con el mismo esquema que la API (lib/validation/pedido.ts) más la
 * anticipación y el mínimo del envío, que dependen del carrito. Si sale
 * bien, va a Mercado Pago. Pagar no confirma el pedido: lo confirma Maggie.
 */
export function CheckoutForm() {
  const { lines, ready } = useCarrito();
  const revision = useRevision();
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<PedidoFieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [redirecting, setRedirecting] = useState(false);

  // Si se vuelve de Mercado Pago con "atrás", el navegador restaura la página
  // tal cual (bfcache): el botón no puede quedar en "Te llevamos…".
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setRedirecting(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  // Hasta leer localStorage no se sabe si está vacío: no se muestra "vacío" de más.
  if (!ready) return <p className="text-secundario">{pages.carrito.checking}</p>;

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
  const horas = anticipacionDe(lines);
  const envioPosible = puedeEnvio(total);
  const sending = status.kind === "sending" || redirecting;
  const minDate = fechaMinima(horas);
  const maxDate = fechaMaxima();
  const franjas = values.date ? franjasDelDia(values.date) : [];
  const libres = values.date ? franjasDisponibles(values.date, horas) : [];

  function payload(next: Values = values) {
    return {
      ...next,
      items: lines.map((linea) => ({
        productId: linea.productId,
        sizeId: linea.sizeId,
        flavor: linea.flavor ?? undefined,
        decoration: linea.decoration ?? undefined,
        quantity: linea.quantity,
      })),
    };
  }

  /** Los errores del esquema más las reglas que dependen del carrito. */
  function validate(next: Values = values): PedidoFieldErrors {
    const result = pedidoSchema.safeParse(payload(next));
    const found: PedidoFieldErrors = result.success ? {} : pedidoFieldErrors(result.error);
    const fecha = validarFechaFranja(next.date, next.slot, horas);
    if (fecha && !found[fecha.field]) found[fecha.field] = fecha.message;
    if (next.delivery === "envio" && !envioPosible && !found.delivery) {
      found.delivery = content.delivery.shippingDisabled(formatPrice(pedidos.entrega.envio.minimo));
    }
    return found;
  }

  /** Muestra los errores y lleva el foco al primer campo inválido. */
  function showErrors(next: PedidoFieldErrors) {
    flushSync(() => setErrors(next));
    const first = fieldOrder.find((field) => next[field]);
    if (first) document.getElementById(ids[first])?.focus();
  }

  function update<K extends keyof Values>(field: K, value: Values[K]) {
    const next = { ...values, [field]: value };
    // Al cambiar el día, si la franja elegida ya no existe ese día, se borra.
    if (field === "date" && !(franjasDelDia(String(value)) as readonly string[]).includes(next.slot)) next.slot = "";
    setValues(next);
    // Si el campo ya tenía un error, se revalida mientras se corrige. El día
    // se revisa al toque: un domingo avisa sin esperar al envío.
    if (errors[field] || field === "date") {
      const found = validate(next);
      setErrors((current) => ({ ...current, [field]: found[field], ...(field === "date" ? { slot: undefined } : {}) }));
    }
  }

  const onText =
    (field: "name" | "email" | "phone" | "address" | "locality" | "date" | "slot" | "notes") =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      update(field, event.target.value);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || hayNoDisponibles) return;

    const found = validate();
    if (Object.values(found).some(Boolean)) {
      setStatus({ kind: "idle" });
      showErrors(found);
      return;
    }
    setErrors({});
    setStatus({ kind: "sending" });

    let response: Response;
    try {
      response = await fetch("/api/v1/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedidoSchema.parse(payload())),
      });
    } catch {
      setStatus({ kind: "error", message: content.networkError, retry: true });
      return;
    }

    // La API responde { data: { id, numero, initPoint } } o { error: { message, fields? } }.
    const { data, error }: { data?: { initPoint?: string }; error?: { message?: string; fields?: PedidoFieldErrors } } =
      await response.json().catch(() => ({}));

    if (response.status === 201 && data?.initPoint) {
      // El carrito se vacía recién cuando el pago se aprueba (/pedido/resultado).
      setRedirecting(true);
      setStatus({ kind: "idle" });
      window.location.assign(data.initPoint);
      return;
    }

    if (response.status === 400 && error?.fields && Object.keys(error.fields).length > 0) {
      setStatus({ kind: "idle" });
      showErrors(error.fields);
      return;
    }

    // 403, 429 (demasiados pedidos), 502 (falló Mercado Pago) o 500.
    setStatus({ kind: "error", message: error?.message ?? content.serverError, retry: response.status >= 500 });
  }

  /** Atributos de accesibilidad de un campo: error e indicaciones asociadas. */
  function a11y(field: PedidoField, hint?: string) {
    const error = errors[field];
    const describedBy = [error && `${ids[field]}-error`, hint].filter(Boolean).join(" ");
    return {
      id: ids[field],
      "aria-invalid": error ? true : undefined,
      "aria-describedby": describedBy || undefined,
    } as const;
  }

  function errorMessage(field: PedidoField) {
    const error = errors[field];
    if (!error) return null;
    return (
      <p id={`${ids[field]}-error`} className="text-13 font-medium text-error">
        {error}
      </p>
    );
  }

  const border = (field: PedidoField) => (errors[field] ? "" : "border-borde-control");
  const legend = "mb-4 font-label text-14 tracking-eyebrow text-chocolate uppercase";
  const label = "text-14 font-medium";

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14">
      {/* El resumen va primero en el DOM: en mobile se ve qué se está pagando antes del formulario. */}
      <aside
        aria-labelledby="checkout-resumen"
        className="flex flex-col gap-4 rounded-3xl border border-borde bg-white p-5 lg:sticky lg:top-34 lg:col-start-2 lg:row-start-1 lg:p-8"
      >
        <h2 id="checkout-resumen" className="text-26">
          {content.summary.title}
        </h2>
        <ul className="flex flex-col gap-3 text-15">
          {lines.map((linea) => (
            <li key={claveLinea(linea)} className="flex justify-between gap-4">
              <span className={disponible(revision, linea) ? "" : "text-secundario line-through"}>
                {linea.quantity} × {linea.name}
                <span className="block text-13 text-secundario">
                  {[linea.sizeLabel, linea.flavor, linea.decoration].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="shrink-0 font-semibold">{formatPrice(linea.unitPrice * linea.quantity)}</span>
            </li>
          ))}
        </ul>
        {values.delivery === "envio" && (
          <div className="flex justify-between gap-4 border-t border-borde pt-3 text-15">
            <span>{content.summary.shipping}</span>
            <span>{content.summary.shippingFree}</span>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-borde pt-4 text-20 font-semibold">
          <span>{content.summary.total}</span>
          <span data-testid="checkout-total">{formatPrice(total)}</span>
        </div>
        <Link href="/carrito" className="self-start py-1 font-semibold text-chocolate underline hover:text-carbon">
          {content.summary.edit}
        </Link>
      </aside>

      <form noValidate onSubmit={onSubmit} aria-describedby="pedido-obligatorios" className="flex flex-col gap-7 lg:col-start-1 lg:row-start-1">
        <p id="pedido-obligatorios" className="text-14 text-secundario">
          {content.requiredNote}
        </p>

        {(hayNoDisponibles || errors.items) && (
          <p
            id={ids.items}
            tabIndex={-1}
            role="alert"
            className="rounded-2xl bg-error-fondo px-5 py-4 font-semibold text-error focus:outline-none"
          >
            {errors.items ?? pages.carrito.fixFirst}{" "}
            <Link href="/carrito" className="text-error underline">
              {content.summary.edit}
            </Link>
          </p>
        )}

        <fieldset className="flex flex-col gap-4">
          <legend className={legend}>{content.contact.title}</legend>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={ids.name} className={label}>
              {content.contact.name} <span aria-hidden="true">*</span>
            </label>
            <input
              {...a11y("name")}
              type="text"
              autoComplete="name"
              required
              value={values.name}
              onChange={onText("name")}
              className={`${inputClasses} ${border("name")}`}
            />
            {errorMessage("name")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.email} className={label}>
                {content.contact.email} <span aria-hidden="true">*</span>
              </label>
              <input
                {...a11y("email")}
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={values.email}
                onChange={onText("email")}
                className={`${inputClasses} ${border("email")}`}
              />
              {errorMessage("email")}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.phone} className={label}>
                {content.contact.phone} <span aria-hidden="true">*</span>
              </label>
              <input
                {...a11y("phone")}
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder={content.contact.phonePlaceholder}
                required
                value={values.phone}
                onChange={onText("phone")}
                className={`${inputClasses} ${border("phone")}`}
              />
              {errorMessage("phone")}
            </div>
          </div>
        </fieldset>

        <fieldset
          aria-describedby={errors.delivery ? `${ids.delivery}-error` : undefined}
          className="flex flex-col gap-3"
        >
          <legend className={legend}>{content.delivery.title}</legend>
          <label className="flex cursor-pointer gap-3 rounded-xl border border-borde-control px-4 py-3 has-checked:border-chocolate has-checked:bg-arena">
            <input
              {...a11y("delivery")}
              type="radio"
              name="entrega"
              value="retiro"
              checked={values.delivery === "retiro"}
              onChange={() => update("delivery", "retiro")}
              className="mt-1 size-4 accent-chocolate"
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-semibold">{content.delivery.pickup}</span>
              <span className="text-14 text-secundario">{content.delivery.pickupHelp}</span>
            </span>
          </label>
          <label
            className={`flex gap-3 rounded-xl border px-4 py-3 ${
              envioPosible
                ? "cursor-pointer border-borde-control has-checked:border-chocolate has-checked:bg-arena"
                : "border-borde text-secundario"
            }`}
          >
            <input
              type="radio"
              name="entrega"
              value="envio"
              checked={values.delivery === "envio"}
              disabled={!envioPosible}
              aria-describedby="pedido-envio-ayuda"
              onChange={() => update("delivery", "envio")}
              className="mt-1 size-4 accent-chocolate"
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-semibold">{content.delivery.shipping}</span>
              <span id="pedido-envio-ayuda" className="text-14 text-secundario">
                {envioPosible
                  ? `${content.delivery.shippingHelp} ${content.delivery.shippingCost}`
                  : content.delivery.shippingDisabled(formatPrice(pedidos.entrega.envio.minimo))}
              </span>
            </span>
          </label>
          {errorMessage("delivery")}

          {values.delivery === "envio" && (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={ids.address} className={label}>
                  {content.delivery.address} <span aria-hidden="true">*</span>
                </label>
                <input
                  {...a11y("address")}
                  type="text"
                  autoComplete="street-address"
                  placeholder={content.delivery.addressPlaceholder}
                  required
                  value={values.address}
                  onChange={onText("address")}
                  className={`${inputClasses} ${border("address")}`}
                />
                {errorMessage("address")}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={ids.locality} className={label}>
                  {content.delivery.locality} <span aria-hidden="true">*</span>
                </label>
                <input
                  {...a11y("locality")}
                  type="text"
                  autoComplete="address-level2"
                  required
                  value={values.locality}
                  onChange={onText("locality")}
                  className={`${inputClasses} ${border("locality")}`}
                />
                {errorMessage("locality")}
              </div>
            </div>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className={legend}>{content.when.title}</legend>
          <p id="pedido-horarios" className="text-14 leading-parrafo text-secundario">
            {content.when.hours} {content.when.leadTime(horas)}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.date} className={label}>
                {content.when.date} <span aria-hidden="true">*</span>
              </label>
              <input
                {...a11y("date", "pedido-horarios")}
                type="date"
                required
                min={minDate}
                max={maxDate}
                value={values.date}
                onChange={onText("date")}
                className={`${inputClasses} ${border("date")}`}
              />
              {errorMessage("date")}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.slot} className={label}>
                {content.when.slot} <span aria-hidden="true">*</span>
              </label>
              <select
                {...a11y("slot")}
                required
                disabled={franjas.length === 0}
                value={values.slot}
                onChange={onText("slot")}
                className={`${inputClasses} ${border("slot")} disabled:bg-arena`}
              >
                <option value="">{content.when.slotPlaceholder}</option>
                {franjas.map((franja) => (
                  <option key={franja} value={franja} disabled={!(libres as readonly string[]).includes(franja)}>
                    {content.when.slotLabel(franja)}
                  </option>
                ))}
              </select>
              {errorMessage("slot")}
            </div>
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.notes} className={label}>
            {content.notes.label}
          </label>
          <textarea
            {...a11y("notes")}
            rows={3}
            maxLength={500}
            placeholder={content.notes.placeholder}
            value={values.notes}
            onChange={onText("notes")}
            className={`${inputClasses} h-auto py-3 ${border("notes")}`}
          />
          {errorMessage("notes")}
        </div>

        <section aria-labelledby="pedido-confirma" className="flex flex-col gap-2 rounded-2xl bg-arena p-5">
          <h2 id="pedido-confirma" className="text-19 font-semibold">
            {content.confirmNotice.title}
          </h2>
          <p className="leading-parrafo">{content.confirmNotice.text}</p>
          <p className="text-14 text-secundario">{content.expires}</p>
        </section>

        {status.kind === "error" && (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl bg-error-fondo px-5 py-4 text-error">
            <p className="font-semibold">{status.message}</p>
            {status.retry && (
              <Button type="submit" variant="secondary" size="sm">
                {content.retry}
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button type="submit" size="lg" disabled={sending || hayNoDisponibles} className="sm:self-start">
            {sending ? content.sending : content.submit}
          </Button>
          <p className="text-14 text-secundario">
            {content.help.text}{" "}
            <a
              href={whatsappLink(whatsappMessages.order)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-chocolate underline hover:text-carbon"
            >
              {content.help.cta}
              <span className="sr-only">{content.help.ctaContext}</span>
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
