import Image from "next/image";
import type { Workshop } from "@/data/workshops";
import { formatDate, formatPrice } from "@/lib/format";
import { Button } from "./Button";

export function WorkshopCard({ workshop }: { workshop: Workshop }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-cacao/10">
      <Image
        src={workshop.image.src}
        alt={workshop.image.alt}
        width={800}
        height={600}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="aspect-4/3 w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="text-sm font-bold tracking-wide text-terracota uppercase">
          <time dateTime={workshop.date}>{formatDate(workshop.date)} h</time>
        </p>
        <h3 className="text-xl font-semibold">{workshop.title}</h3>
        <p className="text-cacao-suave">{workshop.description}</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="font-bold">Duración</dt>
            <dd className="text-cacao-suave">{workshop.duration}</dd>
          </div>
          <div>
            <dt className="font-bold">Nivel</dt>
            <dd className="text-cacao-suave">{workshop.level}</dd>
          </div>
          <div>
            <dt className="font-bold">Cupos</dt>
            <dd className="text-cacao-suave">{workshop.spots} personas</dd>
          </div>
          <div>
            <dt className="font-bold">Precio</dt>
            <dd className="text-cacao-suave">{formatPrice(workshop.price)}</dd>
          </div>
        </dl>
        <Button href="/contacto" variant="outline" className="mt-auto self-start">
          Quiero anotarme<span className="sr-only"> a {workshop.title}</span>
        </Button>
      </div>
    </article>
  );
}
