"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { ImageFrame } from "@/components/ImageFrame";
import { Rich } from "@/components/Rich";
import { pages, ui, whatsappLink, whatsappMessages } from "@/data/site";
import type { Workshop } from "@/lib/data";
import { formatDay, formatMonth, formatPrice, formatTime } from "@/lib/format";
import { inscripcionWhatsappLink, inscripcionWhatsappMessage } from "@/lib/inscripcion-whatsapp";
import { balanceOf, depositOf } from "@/lib/sena";
import {
  experienceOptions,
  fieldErrors,
  inscripcionSchema,
  maxSpotsPerInscripcion,
  referralOptions,
  type FieldErrors,
  type Inscripcion,
  type InscripcionField,
} from "@/lib/validation/inscripcion";

const content = pages.inscripcion;

type Values = {
  name: string;
  whatsapp: string;
  email: string;
  experience: string;
  allergies: string;
  referral: string;
  acceptsPolicy: boolean;
};

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "error"; message: string; retry: boolean };

const initialValues: Values = {
  name: "",
  whatsapp: "",
  email: "",
  experience: "",
  allergies: "",
  referral: "",
  acceptsPolicy: false,
};

/** Orden de los campos en pantalla: el foco va al primero con error. */
const fieldOrder: InscripcionField[] = ["name", "whatsapp", "email", "experience", "allergies", "referral", "acceptsPolicy"];

const ids = {
  name: "inscripcion-nombre",
  whatsapp: "inscripcion-whatsapp",
  email: "inscripcion-email",
  experience: "inscripcion-experiencia",
  allergies: "inscripcion-alergias",
  referral: "inscripcion-conociste",
  acceptsPolicy: "inscripcion-politica",
} satisfies Partial<Record<InscripcionField, string>>;

type FormField = keyof typeof ids;

const inputClasses =
  "h-12 rounded-xl border bg-white px-3.5 text-15 font-normal text-carbon placeholder:text-secundario aria-invalid:border-error aria-invalid:border-2";

/** Formulario de inscripción a un workshop, con el resumen y el selector de lugares. */
export function InscripcionForm({ workshop }: { workshop: Workshop }) {
  const [step, setStep] = useState<"form" | "pay">("form");
  const [spotsLeft, setSpotsLeft] = useState(workshop.spotsLeft);
  const [qty, setQty] = useState(1);
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [submitted, setSubmitted] = useState<Inscripcion | null>(null);
  const fields = useRef<Partial<Record<InscripcionField, HTMLElement | null>>>({});
  const heading = useRef<HTMLHeadingElement>(null);

  const sending = status.kind === "sending";
  const soldOut = step === "form" && spotsLeft === 0;
  const [image] = workshop.images;

  // Sin tipar como InscripcionInput: el formulario puede tener datos inválidos (lo decide el esquema).
  function payload(next: Values = values, spots = qty) {
    return { workshopSlug: workshop.slug, ...next, spots };
  }

  /** Muestra los errores y lleva el foco al primer campo inválido. */
  function showErrors(next: FieldErrors) {
    flushSync(() => setErrors(next));
    const first = fieldOrder.find((field) => next[field]);
    if (first) fields.current[first]?.focus();
  }

  function update<K extends keyof Values>(field: K, value: Values[K]) {
    const next = { ...values, [field]: value };
    setValues(next);
    // Si el campo ya tenía un error, se revalida mientras se corrige.
    if (errors[field]) {
      const result = inscripcionSchema.safeParse(payload(next));
      const message = result.success ? undefined : fieldErrors(result.error)[field];
      setErrors((current) => ({ ...current, [field]: message }));
    }
  }

  const onText = (field: "name" | "whatsapp" | "email" | "allergies" | "referral") =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => update(field, event.target.value);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const parsed = inscripcionSchema.safeParse(payload());
    if (!parsed.success) {
      setStatus({ kind: "idle" });
      showErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setStatus({ kind: "sending" });

    let response: Response;
    try {
      response = await fetch("/api/inscripciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
    } catch {
      setStatus({ kind: "error", message: content.form.networkError, retry: true });
      return;
    }

    // La API responde { data } o { error: { message, fields?, spotsLeft? } }.
    const { error }: { error?: { message?: string; fields?: FieldErrors; spotsLeft?: number } } = await response
      .json()
      .catch(() => ({}));
    const message = error?.message ?? content.form.serverError;

    if (response.status === 201) {
      setSubmitted(parsed.data);
      setSpotsLeft((current) => Math.max(0, current - parsed.data.spots));
      flushSync(() => {
        setStatus({ kind: "idle" });
        setStep("pay");
      });
      heading.current?.focus();
      return;
    }

    if (response.status === 400 && error?.fields && Object.keys(error.fields).length > 0) {
      setStatus({ kind: "idle" });
      showErrors(error.fields);
      return;
    }

    if (response.status === 409 && typeof error?.spotsLeft === "number") {
      const left = error.spotsLeft;
      setSpotsLeft(left);
      setQty((current) => Math.max(1, Math.min(current, left)));
      setStatus({ kind: "error", message, retry: left > 0 });
      return;
    }

    setStatus({ kind: "error", message, retry: response.status >= 500 });
  }

  /** Atributos de accesibilidad de un campo: error e indicaciones asociadas. */
  function a11y(field: FormField) {
    const error = errors[field];
    return {
      id: ids[field],
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `${ids[field]}-error` : undefined,
    } as const;
  }

  function errorMessage(field: FormField) {
    const error = errors[field];
    if (!error) return null;
    return (
      <p id={`${ids[field]}-error`} className="text-13 font-medium text-error">
        {error}
      </p>
    );
  }

  const title = step === "form" ? content.title.form : content.title.pay;
  // Total, seña del 50% y saldo. Sin precio confirmado, los tres quedan "A confirmar".
  const amount = (calc: (total: number) => number) =>
    workshop.price === null ? content.summary.totalTbd : formatPrice(calc(workshop.price * qty));
  const total = amount((value) => value);
  const deposit = amount(depositOf);
  const balance = amount(balanceOf);
  // Nadie reserva más que el cupo libre ni más que el cupo máximo de un workshop.
  const maxQty = Math.min(spotsLeft, maxSpotsPerInscripcion);

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="flex flex-col gap-3">
          <nav aria-label={content.breadcrumb.label}>
            <ol className="flex gap-1 text-14 text-secundario">
              <li>
                <Link href={content.breadcrumb.parent.href} className="text-secundario underline hover:text-carbon">
                  {content.breadcrumb.parent.label}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{content.breadcrumb.current}</li>
            </ol>
          </nav>
          <h1 ref={heading} tabIndex={-1} className="text-40 leading-titulo focus:outline-none lg:text-56">
            {title}
          </h1>
        </div>
        <ol aria-label={content.steps.label} className="flex flex-wrap gap-2 text-13 lg:gap-3 lg:text-14">
          {content.steps.items.map((label, index) => {
            const current = index === (step === "form" ? 0 : 1);
            return (
              <li
                key={label}
                aria-current={current ? "step" : undefined}
                className={`flex h-9 items-center rounded-full px-4 lg:h-10 lg:px-4.5 ${
                  current ? "bg-chocolate font-semibold text-hueso" : "border border-greige text-secundario"
                }`}
              >
                {label}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14">
        {/* El resumen va primero en el DOM: en mobile, el selector de lugares queda antes del formulario. */}
        <aside
          aria-label={content.summary.label}
          className="flex flex-col overflow-hidden rounded-3xl border border-borde bg-white lg:sticky lg:top-34 lg:col-start-2 lg:row-start-1 lg:rounded-4xl"
        >
          <ImageFrame
            src={image?.src}
            alt={image?.alt ?? ""}
            placeholderLabel={ui.imagePending}
            rounded="rounded-none"
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="h-40 lg:h-50"
          />
          <div className="flex flex-col gap-4.5 p-5 lg:p-8">
            <div className="flex flex-col gap-1.5">
              <Eyebrow>{content.summary.eyebrow(formatMonth(workshop.startsAt))}</Eyebrow>
              <h2 className="text-26 lg:text-32">{workshop.name}</h2>
            </div>
            <dl className="flex flex-col gap-2.5 text-15">
              {[
                {
                  term: content.summary.details.date,
                  value: <time dateTime={workshop.startsAt}>{formatDay(workshop.startsAt)}</time>,
                },
                {
                  term: content.summary.details.time,
                  value: formatTime(workshop.startsAt),
                },
                { term: content.summary.details.duration, value: content.summary.duration },
                { term: content.summary.details.place, value: content.summary.place },
                {
                  term: content.summary.details.price,
                  value: workshop.price === null ? ui.priceTbd : formatPrice(workshop.price),
                },
              ].map((detail) => (
                <div key={detail.term} className="flex justify-between gap-4">
                  <dt className="text-secundario">{detail.term}</dt>
                  <dd className="text-right">{detail.value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex items-center justify-between gap-4 border-t border-borde pt-4.5">
              <div className="flex flex-col gap-0.5">
                <strong id="inscripcion-lugares" className="text-15">
                  {content.summary.spots}
                </strong>
                <span className="text-13 font-semibold text-chocolate">{content.summary.spotsLeft(spotsLeft)}</span>
              </div>
              {step === "form" && !soldOut ? (
                <div
                  role="group"
                  aria-labelledby="inscripcion-lugares"
                  className="flex items-center rounded-full border border-borde-control"
                >
                  <button
                    type="button"
                    aria-label={content.summary.less}
                    disabled={qty <= 1 || sending}
                    onClick={() => setQty((current) => Math.max(1, current - 1))}
                    className="size-11 rounded-full text-18 text-carbon disabled:cursor-not-allowed disabled:text-greige"
                  >
                    −
                  </button>
                  <span aria-live="polite" className="w-7 text-center font-semibold">
                    <span aria-hidden="true">{qty}</span>
                    <span className="sr-only">{content.summary.spotsCount(qty)}</span>
                  </span>
                  <button
                    type="button"
                    aria-label={content.summary.more}
                    disabled={qty >= maxQty || sending}
                    onClick={() => setQty((current) => Math.min(maxQty, current + 1))}
                    className="size-11 rounded-full text-18 text-carbon disabled:cursor-not-allowed disabled:text-greige"
                  >
                    +
                  </button>
                </div>
              ) : (
                <span className="font-semibold">{content.summary.spotsCount(submitted?.spots ?? qty)}</span>
              )}
            </div>
            <dl className="flex flex-col gap-2 border-t border-borde pt-4.5">
              <div className="flex justify-between gap-4 text-15">
                <dt className="text-secundario">{content.summary.total}</dt>
                <dd data-testid="inscripcion-total">{total}</dd>
              </div>
              <div className="flex justify-between gap-4 text-20 font-semibold">
                <dt>{content.summary.deposit}</dt>
                <dd data-testid="inscripcion-sena" className="shrink-0 text-right">
                  {deposit}
                </dd>
              </div>
              <div className="flex justify-between gap-4 text-14 text-secundario">
                <dt>{content.summary.balance}</dt>
                <dd data-testid="inscripcion-saldo">{balance}</dd>
              </div>
            </dl>
          </div>
        </aside>

        <div className="flex flex-col gap-7 lg:col-start-1 lg:row-start-1">
          {soldOut && (
            <section
              aria-labelledby="agotado-titulo"
              className="flex flex-col items-start gap-4 rounded-3xl bg-arena p-6 lg:p-10"
            >
              <h2 id="agotado-titulo" className="text-26 lg:text-34">
                {content.soldOut.title}
              </h2>
              <p className="leading-parrafo">{content.soldOut.text}</p>
              <Button href={whatsappLink(whatsappMessages.workshopWaitlist(workshop.name))} size="lg">
                {content.soldOut.cta}
              </Button>
            </section>
          )}

          {step === "form" && !soldOut && (
            <form noValidate onSubmit={onSubmit} aria-describedby="inscripcion-obligatorios" className="flex flex-col gap-7">
              <p id="inscripcion-obligatorios" className="text-14 text-secundario">
                {content.form.requiredNote}
              </p>

              <fieldset className="flex flex-col gap-4">
                <legend className="mb-4 font-label text-14 tracking-eyebrow text-chocolate uppercase">
                  {content.form.aboutYou}
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={ids.name} className="text-14 font-medium">
                      {content.form.name} <span aria-hidden="true">*</span>
                    </label>
                    <input
                      {...a11y("name")}
                      ref={(element) => {
                        fields.current.name = element;
                      }}
                      type="text"
                      autoComplete="name"
                      required
                      value={values.name}
                      onChange={onText("name")}
                      className={`${inputClasses} ${errors.name ? "" : "border-borde-control"}`}
                    />
                    {errorMessage("name")}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={ids.whatsapp} className="text-14 font-medium">
                      {content.form.whatsapp} <span aria-hidden="true">*</span>
                    </label>
                    <input
                      {...a11y("whatsapp")}
                      ref={(element) => {
                        fields.current.whatsapp = element;
                      }}
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder={content.form.whatsappPlaceholder}
                      required
                      value={values.whatsapp}
                      onChange={onText("whatsapp")}
                      className={`${inputClasses} ${errors.whatsapp ? "" : "border-borde-control"}`}
                    />
                    {errorMessage("whatsapp")}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={ids.email} className="text-14 font-medium">
                    {content.form.email} <span aria-hidden="true">*</span>
                  </label>
                  <input
                    {...a11y("email")}
                    ref={(element) => {
                      fields.current.email = element;
                    }}
                    type="email"
                    autoComplete="email"
                    required
                    value={values.email}
                    onChange={onText("email")}
                    className={`${inputClasses} ${errors.email ? "" : "border-borde-control"}`}
                  />
                  {errorMessage("email")}
                </div>
              </fieldset>

              {/* Grupo de radios con role="radiogroup" (y no fieldset) para poder marcarlo inválido. */}
              <div className="flex flex-col gap-3">
                <p
                  id={`${ids.experience}-legend`}
                  className="mb-3 font-label text-14 tracking-eyebrow text-chocolate uppercase"
                >
                  {content.form.experience}
                </p>
                <div
                  role="radiogroup"
                  aria-labelledby={`${ids.experience}-legend`}
                  aria-invalid={errors.experience ? true : undefined}
                  aria-describedby={errors.experience ? `${ids.experience}-error` : undefined}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {experienceOptions.map((option, index) => (
                    <label
                      key={option}
                      className="flex h-12 cursor-pointer items-center gap-2.5 rounded-xl border border-borde-control bg-white px-4 text-15 has-checked:border-2 has-checked:border-chocolate"
                    >
                      <input
                        ref={
                          index === 0
                            ? (element) => {
                                fields.current.experience = element;
                              }
                            : undefined
                        }
                        type="radio"
                        name="experience"
                        value={option}
                        checked={values.experience === option}
                        onChange={() => update("experience", option)}
                        className="size-4.5 accent-chocolate"
                      />
                      {option}
                    </label>
                  ))}
                </div>
                {errorMessage("experience")}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={ids.allergies} className="text-14 font-medium">
                  {content.form.allergies}
                </label>
                <textarea
                  {...a11y("allergies")}
                  ref={(element) => {
                    fields.current.allergies = element;
                  }}
                  placeholder={content.form.allergiesPlaceholder}
                  value={values.allergies}
                  onChange={onText("allergies")}
                  className={`${inputClasses} h-22 resize-none py-3 ${errors.allergies ? "" : "border-borde-control"}`}
                />
                {errorMessage("allergies")}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={ids.referral} className="text-14 font-medium">
                  {content.form.referral}
                </label>
                <select
                  {...a11y("referral")}
                  ref={(element) => {
                    fields.current.referral = element;
                  }}
                  value={values.referral}
                  onChange={onText("referral")}
                  className={`${inputClasses} ${errors.referral ? "" : "border-borde-control"}`}
                >
                  <option value="">{content.form.referralPlaceholder}</option>
                  {referralOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errorMessage("referral")}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-3 text-15 leading-normal">
                  <input
                    {...a11y("acceptsPolicy")}
                    ref={(element) => {
                      fields.current.acceptsPolicy = element;
                    }}
                    type="checkbox"
                    required
                    checked={values.acceptsPolicy}
                    onChange={(event) => update("acceptsPolicy", event.target.checked)}
                    className="mt-0.5 size-5 shrink-0 accent-chocolate"
                  />
                  <label htmlFor={ids.acceptsPolicy}>
                    <Rich text={content.form.policy} /> <span aria-hidden="true">*</span>
                  </label>
                </div>
                {errorMessage("acceptsPolicy")}
              </div>

              {status.kind === "error" && (
                <div
                  role="alert"
                  className="flex flex-col items-start gap-3 rounded-2xl border-2 border-error bg-white p-4 text-15 leading-normal sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="font-medium text-error">{status.message}</p>
                  {status.retry && (
                    <Button type="submit" variant="secondary" size="sm" className="shrink-0">
                      {content.form.retry}
                    </Button>
                  )}
                </div>
              )}

              <Button type="submit" size="lg" disabled={sending} aria-busy={sending} className="sm:self-start disabled:cursor-wait disabled:opacity-80">
                {sending && (
                  <span
                    aria-hidden="true"
                    className="size-4 animate-spin rounded-full border-2 border-hueso border-t-transparent motion-reduce:animate-none"
                  />
                )}
                {sending ? content.form.sending : content.form.submit}
              </Button>
            </form>
          )}

          {step === "pay" && submitted && (
            <div className="flex flex-col gap-6">
              <section
                aria-labelledby="inscripcion-revision"
                className="flex flex-col gap-3.5 rounded-3xl border border-borde p-6 lg:p-8"
              >
                <h2 id="inscripcion-revision" className="font-label text-14 tracking-eyebrow text-chocolate uppercase">
                  {content.pay.reviewTitle}
                </h2>
                <ul className="grid gap-x-6 gap-y-3 text-15 sm:grid-cols-2">
                  <li>{submitted.name}</li>
                  <li>{submitted.whatsapp}</li>
                  <li className="break-all">{submitted.email}</li>
                  {submitted.experience && <li>{content.pay.experience(submitted.experience)}</li>}
                  <li>{content.pay.spots(submitted.spots)}</li>
                </ul>
              </section>

              <section aria-labelledby="inscripcion-whatsapp-texto" className="flex flex-col gap-4">
                <p id="inscripcion-whatsapp-texto" className="text-17 leading-parrafo font-medium">
                  {content.pay.whatsapp.text}
                </p>
                <figure className="rounded-2xl bg-arena p-4 text-14 leading-medio">
                  <figcaption className="sr-only">{content.pay.whatsapp.messageLabel}</figcaption>
                  <p className="whitespace-pre-line">{inscripcionWhatsappMessage(workshop, submitted)}</p>
                </figure>
                <Button
                  href={inscripcionWhatsappLink(workshop, submitted)}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  className="w-full"
                >
                  {content.pay.whatsapp.cta}
                  <span className="sr-only">{content.pay.whatsapp.ctaContext}</span>
                </Button>
              </section>

              <p className="flex gap-3 rounded-2xl bg-arena p-4 text-14 leading-normal">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  aria-hidden="true"
                  className="mt-px shrink-0"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16h.01" />
                </svg>
                <span className="flex flex-col gap-1">
                  <span>{content.pay.deposit}</span>
                  <span>{content.pay.balance}</span>
                  <span>{content.pay.note}</span>
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
