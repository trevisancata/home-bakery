import type { Metadata } from "next";
import Link from "next/link";
import { PanelMain } from "@/components/admin/panel/Encabezado";
import { Icono } from "@/components/admin/ui/Icono";
import { WorkshopForm } from "@/components/admin/workshops/WorkshopForm";
import { admin } from "@/data/admin";
import { requireAdminPage } from "@/lib/auth";

const content = admin.workshops;

export const metadata: Metadata = { title: content.titleNew };

export default async function NuevoWorkshopPage() {
  await requireAdminPage("/admin/workshops/nuevo");
  return (
    <PanelMain>
      <div className="flex flex-col gap-1">
        <Link href="/admin/workshops" className="flex min-h-11 items-center gap-1 self-start text-14 text-secundario underline hover:text-carbon">
          <Icono nombre="volver" size={16} />
          {content.back}
        </Link>
        <h1 className="text-36 lg:text-44">{content.titleNew}</h1>
      </div>
      <WorkshopForm workshop={null} creado={false} />
    </PanelMain>
  );
}
