import type { Metadata } from "next";
import { HowITeach } from "@/components/workshops/HowITeach";
import { PastWorkshops } from "@/components/workshops/PastWorkshops";
import { UpcomingDates } from "@/components/workshops/UpcomingDates";
import { WorkshopSteps } from "@/components/workshops/WorkshopSteps";
import { WorkshopsFaq } from "@/components/workshops/WorkshopsFaq";
import { WorkshopsHero } from "@/components/workshops/WorkshopsHero";
import { pages } from "@/data/site";
import { getWorkshops } from "@/lib/data";

export const metadata: Metadata = pages.workshops.metadata;

// ISR: los lugares libres se actualizan cada 5 minutos (la inscripción los
// lee en cada request). TODO(E5): revalidación on-demand.
export const revalidate = 300;

export default async function WorkshopsPage() {
  const upcoming = await getWorkshops();

  return (
    <>
      <WorkshopsHero />
      <HowITeach />
      <WorkshopSteps />
      <div className="contenedor flex flex-col gap-14 pt-14 pb-16 lg:gap-26 lg:pt-26 lg:pb-30">
        {upcoming.length > 0 && <UpcomingDates workshops={upcoming} />}
        <PastWorkshops />
        <WorkshopsFaq />
      </div>
    </>
  );
}
