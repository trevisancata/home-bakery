import type { Metadata } from "next";
import { PanelMain } from "@/components/admin/panel/Encabezado";
import { ProductoForm } from "@/components/admin/productos/ProductoForm";
import { admin } from "@/data/admin";
import { listarCategorias } from "@/lib/admin/categorias";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = admin.editor.metadataNew;

export default async function NuevoProductoPage() {
  const session = await requireAdminPage("/admin/productos/nuevo");
  const categorias = await listarCategorias(session.supabase);
  return (
    <PanelMain>
      <ProductoForm producto={null} categorias={categorias.map((c) => ({ id: c.id, name: c.name }))} creado={false} />
    </PanelMain>
  );
}
