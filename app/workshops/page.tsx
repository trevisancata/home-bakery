import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { WorkshopCard } from "@/components/WorkshopCard";
import { pages, upcomingWorkshops } from "@/data/site";

const content = pages.workshops;

export const metadata: Metadata = content.metadata;

export default function WorkshopsPage() {
  return (
    <>
      <PageHeader eyebrow={content.eyebrow} title={content.title} script={content.script}>
        <p>{content.intro}</p>
      </PageHeader>

      <Section id="proximos" title={content.upcoming.title} tone="arena">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingWorkshops.map((workshop) => (
            <li key={workshop.id}>
              <WorkshopCard workshop={workshop} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="como-funciona" title={content.howItWorks.title}>
        <ol className="grid gap-6 md:grid-cols-3">
          {content.howItWorks.steps.map((step, index) => (
            <li key={step.title} className="rounded-4xl bg-arena p-6 lg:p-8">
              <span
                aria-hidden="true"
                className="flex size-12 items-center justify-center rounded-full bg-chocolate font-display text-xl text-hueso"
              >
                {index + 1}
              </span>
              <h3 className="mt-5 text-2xl">{step.title}</h3>
              <p className="mt-2 text-secundario">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
