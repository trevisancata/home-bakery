import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { site } from "@/data/site";
import { workshops } from "@/data/workshops";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Hacé tu pedido o reservá tu lugar en un workshop.",
};

const inputClasses =
  "mt-2 block w-full rounded-xl border-2 border-cacao-suave bg-white px-4 py-3 text-cacao placeholder:text-cacao-suave";

export default function ContactoPage() {
  return (
    <>
      <PageHeader eyebrow="Escribime" title="Contacto">
        <p>
          ¿Querés hacer un pedido o anotarte en un workshop? Completá el formulario y te respondo
          dentro de las 24 horas hábiles.
        </p>
      </PageHeader>

      <Section id="formulario" title="Mandame tu consulta" tone="rosa">
        <div className="grid gap-12 lg:grid-cols-[3fr_2fr]">
          {/* Solo maquetado: el envío se implementa más adelante. */}
          <form className="space-y-6 rounded-2xl bg-crema p-6 sm:p-8">
            <p className="text-sm text-cacao-suave">
              Los campos marcados con <span aria-hidden="true">*</span>
              <span className="sr-only">asterisco</span> son obligatorios.
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="nombre" className="font-semibold">
                  Nombre <span aria-hidden="true">*</span>
                </label>
                <input id="nombre" name="nombre" type="text" autoComplete="name" required className={inputClasses} />
              </div>
              <div>
                <label htmlFor="email" className="font-semibold">
                  Email <span aria-hidden="true">*</span>
                </label>
                <input id="email" name="email" type="email" autoComplete="email" required className={inputClasses} />
              </div>
            </div>

            <div>
              <label htmlFor="telefono" className="font-semibold">
                Teléfono
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                autoComplete="tel"
                aria-describedby="telefono-ayuda"
                className={inputClasses}
              />
              <p id="telefono-ayuda" className="mt-2 text-sm text-cacao-suave">
                Opcional. Si lo dejás, te respondo por WhatsApp.
              </p>
            </div>

            <fieldset>
              <legend className="font-semibold">
                Motivo de la consulta <span aria-hidden="true">*</span>
              </legend>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-6">
                {[
                  { value: "pedido", label: "Hacer un pedido" },
                  { value: "workshop", label: "Anotarme a un workshop" },
                  { value: "otra", label: "Otra consulta" },
                ].map((option, index) => (
                  <label key={option.value} className="flex min-h-11 items-center gap-3">
                    <input
                      type="radio"
                      name="motivo"
                      value={option.value}
                      defaultChecked={index === 0}
                      required
                      className="size-5 accent-terracota"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="workshop" className="font-semibold">
                Workshop de interés
              </label>
              <select id="workshop" name="workshop" className={inputClasses} defaultValue="">
                <option value="">Ninguno en particular</option>
                {workshops.map((workshop) => (
                  <option key={workshop.id} value={workshop.id}>
                    {workshop.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mensaje" className="font-semibold">
                Mensaje <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="mensaje"
                name="mensaje"
                rows={5}
                required
                aria-describedby="mensaje-ayuda"
                className={inputClasses}
              />
              <p id="mensaje-ayuda" className="mt-2 text-sm text-cacao-suave">
                Si es un pedido, contame qué producto, para cuántas personas y para qué fecha.
              </p>
            </div>

            <Button type="submit">Enviar consulta</Button>
          </form>

          <aside aria-labelledby="otras-vias-titulo">
            <h3 id="otras-vias-titulo" className="text-2xl font-semibold">
              Otras formas de contacto
            </h3>
            <address className="mt-4 space-y-3 text-lg not-italic">
              <p>
                <a href={`mailto:${site.contact.email}`} className="text-terracota underline hover:text-cacao">
                  {site.contact.email}
                </a>
              </p>
              <p>
                <a href={site.contact.whatsappUrl} className="text-terracota underline hover:text-cacao">
                  WhatsApp {site.contact.whatsapp}
                </a>
              </p>
              <p>{site.city}</p>
            </address>
            <p className="mt-6 text-cacao-suave">{site.contact.hours}.</p>
            <p className="mt-2 text-cacao-suave">{site.contact.pickup}.</p>
          </aside>
        </div>
      </Section>
    </>
  );
}
