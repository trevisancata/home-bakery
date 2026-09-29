import type { Metadata } from "next";
import { Eyebrow } from "@/components/Eyebrow";
import { FeaturedWorkshop } from "@/components/workshops/FeaturedWorkshop";
import { PastWorkshops } from "@/components/workshops/PastWorkshops";
import { UpcomingDates } from "@/components/workshops/UpcomingDates";
import { WorkshopsFaq } from "@/components/workshops/WorkshopsFaq";
import { pages } from "@/data/site";
import { getFeaturedWorkshop, getWorkshops } from "@/lib/data";

const content = pages.workshops;

export const metadata: Metadata = content.metadata;

export default async function WorkshopsPage() {
  const [featured, upcoming] = await Promise.all([getFeaturedWorkshop(), getWorkshops()]);

  return (
    <div className="contenedor flex flex-col gap-12 pt-10 pb-16 lg:gap-18 lg:pt-16 lg:pb-26">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="flex flex-col gap-3 lg:gap-4">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h1 className="text-44 leading-none lg:text-72">{content.title}</h1>
        </div>
        <p className="max-w-115 text-17 leading-parrafo text-secundario lg:text-18">{content.intro}</p>
      </header>

      {featured && <FeaturedWorkshop workshop={featured} />}
      {upcoming.length > 0 && <UpcomingDates workshops={upcoming} />}
      <PastWorkshops />
      <WorkshopsFaq />
    </div>
  );
}
