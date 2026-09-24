import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { WorkshopCard } from "@/components/WorkshopCard";
import { upcomingWorkshops } from "@/data/workshops";

export const metadata: Metadata = {
  title: "Workshops",
  description: "Workshops de pastelería casera en grupos reducidos, para todos los niveles.",
};

const steps = [
  {
    title: "Elegí tu workshop",
    text: "Mirá las fechas y elegí el que más te guste. Si es tu primera vez, empezá por uno de nivel inicial.",
  },
  {
    title: "Reservá tu lugar",
    text: "Escribime por el formulario de contacto o por WhatsApp. El lugar se confirma con una seña del 50 %.",
  },
  {
    title: "Vení con ganas",
    text: "Los ingredientes, los utensilios y el delantal los pongo yo. Vos te llevás lo que horneás y las recetas.",
  },
];

export default function WorkshopsPage() {
  return (
    <>
      <PageHeader eyebrow="Aprendé a hornear" title="Workshops">
        <p>
          Encuentros en grupos chicos para aprender técnicas de pastelería casera, paso a paso y
          sin apuro.
        </p>
      </PageHeader>

      <Section id="proximos" title="Próximas fechas" tone="rosa">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingWorkshops.map((workshop) => (
            <li key={workshop.id}>
              <WorkshopCard workshop={workshop} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="como-funciona" title="¿Cómo funcionan?">
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl bg-white p-6 ring-1 ring-cacao/10">
              <span aria-hidden="true" className="font-serif text-4xl font-semibold text-terracota">
                {index + 1}
              </span>
              <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-cacao-suave">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
