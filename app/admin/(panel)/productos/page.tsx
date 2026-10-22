import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Encabezado, PanelMain } from "@/components/admin/panel/Encabezado";
import { type FilaProducto, ListaProductos } from "@/components/admin/productos/ListaProductos";
import { Icono } from "@/components/admin/ui/Icono";
import { admin } from "@/data/admin";
import { listarCategorias } from "@/lib/admin/categorias";
import { listarProductos, maxDestacados } from "@/lib/admin/productos";
import { requireAdminPage } from "@/lib/auth";

const content = admin.productos;

export const metadata: Metadata = content.metadata;

export default async function ProductosPage({ searchParams }: PageProps<"/admin/productos">) {
  const session = await requireAdminPage("/admin/productos");
  const [productos, categorias, { borrado }] = await Promise.all([
    listarProductos(session.supabase),
    listarCategorias(session.supabase),
    searchParams,
  ]);

  // Solo lo que usa la lista (sin descripciones ni sabores).
  const filas: FilaProducto[] = productos.map((p) => {
    const cover = p.images.find((img) => img.cover) ?? p.images[0];
    return {
      id: p.id,
      name: p.name,
      detail: [p.servings, p.measure, p.presentation].filter(Boolean).join(" · "),
      category: { slug: p.category.slug, name: p.category.name },
      active: p.active,
      featured: p.featured,
      cover: cover ? { src: cover.src, alt: cover.alt } : null,
      sizes: p.sizes,
    };
  });

  return (
    <PanelMain>
      <Encabezado eyebrow={content.eyebrow} title={content.title}>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-chocolate px-5 text-15 font-semibold text-hueso no-underline hover:bg-carbon"
        >
          <Icono nombre="mas" />
          {content.newProduct}
        </Link>
      </Encabezado>
      {/* useSearchParams (filtros en la URL) necesita un Suspense. */}
      <Suspense>
        <ListaProductos
          productos={filas}
          categorias={categorias.map((c) => ({ slug: c.slug, name: c.name }))}
          maxDestacados={maxDestacados}
          avisoInicial={typeof borrado === "string" ? admin.editor.deleted(borrado) : null}
        />
      </Suspense>
    </PanelMain>
  );
}
