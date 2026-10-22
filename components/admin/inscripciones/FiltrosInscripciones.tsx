"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { admin } from "@/data/admin";
import { inscripcionStatuses } from "@/lib/admin/schemas";

const content = admin.inscripciones;

/** Filtros por workshop y estado, en la URL (la página filtra en el servidor). */
export function FiltrosInscripciones({ workshops }: { workshops: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(nombre: string, valor: string) {
    const next = new URLSearchParams(params.toString());
    if (valor) next.set(nombre, valor);
    else next.delete(nombre);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  const select = "h-11 rounded-full border border-borde-control bg-white px-3.5 text-14";
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="flex flex-col gap-1 text-14 font-semibold">
        {content.filterWorkshop}
        <select value={params.get("workshop") ?? ""} onChange={(e) => set("workshop", e.target.value)} className={select}>
          <option value="">{content.allWorkshops}</option>
          {workshops.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-14 font-semibold">
        {content.filterStatus}
        <select value={params.get("estado") ?? ""} onChange={(e) => set("estado", e.target.value)} className={select}>
          <option value="">{content.allStatuses}</option>
          {inscripcionStatuses.map((s) => (
            <option key={s} value={s}>
              {admin.pagos.status[s]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
