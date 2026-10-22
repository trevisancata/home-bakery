import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PanelMain } from "@/components/admin/panel/Encabezado";
import { ProductoForm } from "@/components/admin/productos/ProductoForm";
import { admin } from "@/data/admin";
import { listarCategorias } from "@/lib/admin/categorias";
import { NotFoundError } from "@/lib/admin/errors";
import { obtenerProducto } from "@/lib/admin/productos";
import { parseId } from "@/lib/admin/schemas";
import { requireAdminPage } from "@/lib/auth";

async function cargar(id: string) {
  const session = await requireAdminPage(`/admin/productos/${id}`);
  try {
    return { session, producto: await obtenerProducto(session.supabase, parseId(id)) };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/admin/productos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { producto } = await cargar(id);
  return admin.editor.metadataEdit(producto.name);
}

export default async function EditarProductoPage({ params, searchParams }: PageProps<"/admin/productos/[id]">) {
  const { id } = await params;
  const { creado } = await searchParams;
  const { session, producto } = await cargar(id);
  const categorias = await listarCategorias(session.supabase);
  return (
    <PanelMain>
      {/* key: si cambia el producto, el formulario arranca de cero. */}
      <ProductoForm key={producto.id} producto={producto} categorias={categorias.map((c) => ({ id: c.id, name: c.name }))} creado={creado === "1"} />
    </PanelMain>
  );
}
