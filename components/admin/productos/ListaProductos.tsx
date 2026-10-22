"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { cambiarDestacado, cambiarVisibilidad } from "@/app/admin/(panel)/productos/actions";
import { PrecioEnLinea } from "@/components/admin/productos/PrecioEnLinea";
import { Aviso, useAviso } from "@/components/admin/ui/Aviso";
import { EstadoVacio } from "@/components/admin/ui/EstadoVacio";
import { Icono } from "@/components/admin/ui/Icono";
import { Switch } from "@/components/admin/ui/Switch";
import { admin } from "@/data/admin";

const content = admin.productos;

export type FilaProducto = {
  id: string;
  name: string;
  detail: string;
  category: { slug: string; name: string };
  active: boolean;
  featured: boolean;
  cover: { src: string; alt: string } | null;
  sizes: { id: string; label: string; price: number | null }[];
};

type Estado = "todos" | "activos" | "pausados";
const estados: Estado[] = ["todos", "activos", "pausados"];

/** Sin tildes ni mayúsculas: "budin" encuentra "Budín". */
const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Lista de productos del panel (docs/mockup/admin-productos.html y su versión
 * mobile): buscador, chips de estado, categoría, precio en línea, switch de
 * la tienda con "Deshacer" y estrella de destacado. Los filtros viven en la
 * URL para que sobrevivan a una recarga.
 */
export function ListaProductos({
  productos,
  categorias,
  maxDestacados,
  avisoInicial,
}: {
  productos: FilaProducto[];
  categorias: { slug: string; name: string }[];
  maxDestacados: number;
  avisoInicial: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [filas, setFilas] = useState(productos);
  const [q, setQ] = useState(params.get("q") ?? "");
  const estado = (estados.includes(params.get("estado") as Estado) ? params.get("estado") : "todos") as Estado;
  const categoria = params.get("categoria") ?? "";
  const { aviso, avisar, cerrar } = useAviso();
  const [, startTransition] = useTransition();

  // Aviso que viene de otra página (por ejemplo, "Red velvet se borró.").
  useEffect(() => {
    if (avisoInicial) avisar({ texto: avisoInicial });
  }, [avisoInicial, avisar]);

  function setParam(nombre: string, valor: string) {
    const next = new URLSearchParams(params.toString());
    if (valor) next.set(nombre, valor);
    else next.delete(nombre);
    next.delete("borrado");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  const visibles = useMemo(() => {
    const busqueda = normalizar(q.trim());
    return filas.filter(
      (p) =>
        (estado === "todos" || (estado === "activos") === p.active) &&
        (!categoria || p.category.slug === categoria) &&
        (!busqueda || normalizar(`${p.name} ${p.detail} ${p.category.name}`).includes(busqueda)),
    );
  }, [filas, q, estado, categoria]);

  const destacados = filas.filter((p) => p.featured && p.active).length;

  function actualizarFila(id: string, cambios: Partial<FilaProducto>) {
    setFilas((actuales) => actuales.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
  }

  function visibilidad(producto: FilaProducto, active: boolean, conDeshacer = true) {
    actualizarFila(producto.id, { active });
    startTransition(async () => {
      const resultado = await cambiarVisibilidad(producto.id, active);
      if (!resultado.ok) {
        actualizarFila(producto.id, { active: !active });
        avisar({ texto: resultado.message, tipo: "error" });
        return;
      }
      avisar({
        texto: active ? content.activeToast(producto.name) : content.pausedToast(producto.name),
        accion: conDeshacer ? { label: admin.ui.undo, onClick: () => visibilidad(producto, !active, false) } : undefined,
      });
    });
  }

  function destacar(producto: FilaProducto) {
    const featured = !producto.featured;
    if (featured && producto.active && destacados >= maxDestacados) {
      avisar({ texto: `Ya hay ${maxDestacados} destacados. Sacá uno antes de sumar otro.`, tipo: "error" });
      return;
    }
    actualizarFila(producto.id, { featured });
    startTransition(async () => {
      const resultado = await cambiarDestacado(producto.id, featured);
      if (!resultado.ok) {
        actualizarFila(producto.id, { featured: !featured });
        avisar({ texto: resultado.message, tipo: "error" });
        return;
      }
      avisar({ texto: featured ? content.featuredOn(producto.name) : content.featuredOff(producto.name) });
    });
  }

  const precios = (p: FilaProducto) =>
    p.sizes.length === 0 ? (
      <span className="text-14 text-secundario">{content.noSizes}</span>
    ) : (
      <div className="flex flex-col gap-1">
        {p.sizes.map((size) => (
          <div key={size.id} className="flex flex-col gap-0.5">
            {p.sizes.length > 1 && <span className="text-12 text-secundario">{size.label}</span>}
            <PrecioEnLinea sizeId={size.id} price={size.price} label={content.priceLabel(p.name, p.sizes.length > 1 ? size.label : undefined)} />
          </div>
        ))}
      </div>
    );

  const estrella = (p: FilaProducto) => (
    <button
      type="button"
      aria-pressed={p.featured}
      aria-label={content.featured(p.name)}
      onClick={() => destacar(p)}
      className={`flex size-11 items-center justify-center rounded-full hover:bg-arena ${p.featured ? "text-chocolate" : "text-secundario"}`}
    >
      <Icono nombre="estrella" relleno={p.featured} />
    </button>
  );

  const tienda = (p: FilaProducto) => (
    <div className="flex items-center gap-1">
      <Switch checked={p.active} onChange={(active) => visibilidad(p, active)} label={content.switchLabel(p.name)} />
      <span className={`text-14 font-semibold ${p.active ? "text-abierto" : "text-secundario"}`}>
        {p.active ? content.active : content.paused}
      </span>
    </div>
  );

  const foto = (p: FilaProducto, size: string) =>
    p.cover ? (
      <Image
        src={p.cover.src}
        alt=""
        width={56}
        height={56}
        sizes="56px"
        className={`${size} shrink-0 rounded-xl object-cover ${p.active ? "" : "opacity-45"}`}
      />
    ) : (
      <span aria-hidden="true" className={`${size} shrink-0 rounded-xl bg-placeholder ${p.active ? "" : "opacity-45"}`} />
    );

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <label className="relative block grow lg:max-w-105">
          <span className="pointer-events-none absolute top-3.5 left-3.5 text-secundario">
            <Icono nombre="buscar" />
          </span>
          <span className="sr-only">{content.search}</span>
          <input
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onBlur={() => setParam("q", q.trim())}
            placeholder={content.searchPlaceholder}
            className="h-12 w-full rounded-full border border-borde-control bg-white pr-4 pl-11 text-16"
          />
        </label>
        <div role="group" aria-label={content.filtersLabel} className="flex gap-2">
          {estados.map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={estado === e}
              onClick={() => setParam("estado", e === "todos" ? "" : e)}
              className={`min-h-11 rounded-full border px-4 text-14 ${
                estado === e ? "border-carbon bg-carbon font-semibold text-white" : "border-borde-control bg-white text-carbon"
              }`}
            >
              {content.filters[e]}
            </button>
          ))}
        </div>
        <label className="flex flex-col">
          <span className="sr-only">{content.categoryLabel}</span>
          <select
            value={categoria}
            onChange={(event) => setParam("categoria", event.target.value)}
            className="h-11 rounded-full border border-borde-control bg-white px-3.5 text-14"
          >
            <option value="">{content.allCategories}</option>
            {categorias.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p aria-live="polite" className="text-14 text-secundario">
        {content.count(visibles.length)}
      </p>

      {visibles.length === 0 ? (
        <EstadoVacio
          accion={
            <button
              type="button"
              onClick={() => {
                setQ("");
                router.replace(pathname, { scroll: false });
              }}
              className="min-h-11 font-semibold text-chocolate underline"
            >
              {content.clearFilters}
            </button>
          }
        >
          {content.empty}
        </EstadoVacio>
      ) : (
        <>
          {/* Desktop: tabla */}
          <div className="hidden overflow-hidden rounded-3xl border border-borde bg-white lg:block">
            <table className="w-full border-collapse text-15">
              <thead>
                <tr className="bg-arena text-left text-13 text-chocolate">
                  <th scope="col" className="px-5 py-3.5 font-semibold">{content.columns.product}</th>
                  <th scope="col" className="px-3.5 py-3.5 font-semibold">{content.columns.category}</th>
                  <th scope="col" className="px-3.5 py-3.5 font-semibold">{content.columns.price}</th>
                  <th scope="col" className="px-3.5 py-3.5 font-semibold">{content.columns.inStore}</th>
                  <th scope="col" className="px-5 py-3.5 text-right font-semibold">{content.columns.actions}</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => (
                  <tr key={p.id} data-testid={`producto-${p.id}`} className="border-t border-borde align-top">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3.5">
                        {foto(p, "size-14")}
                        <div className="flex flex-col gap-0.5">
                          <strong className="text-15">{p.name}</strong>
                          {p.detail && <span className="text-13 text-secundario">{p.detail}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-secundario">{p.category.name}</td>
                    <td className="px-3.5 py-3">{precios(p)}</td>
                    <td className="px-3.5 py-3">{tienda(p)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {estrella(p)}
                        <Link
                          href={`/admin/productos/${p.id}`}
                          aria-label={content.editLabel(p.name)}
                          className="inline-flex min-h-11 items-center gap-2 rounded-full border-trazo border-carbon px-4 text-14 font-semibold text-carbon no-underline hover:bg-carbon hover:text-white"
                        >
                          <Icono nombre="editar" size={16} />
                          {content.edit}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: tarjetas */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {visibles.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 rounded-2xl border border-borde bg-white p-4">
                <div className="flex items-start gap-3">
                  {foto(p, "size-14")}
                  <div className="flex min-w-0 grow flex-col gap-0.5">
                    <strong>{p.name}</strong>
                    <span className="text-13 text-secundario">{p.category.name}</span>
                  </div>
                  {estrella(p)}
                </div>
                {precios(p)}
                <div className="flex items-center justify-between gap-2">
                  {tienda(p)}
                  <Link
                    href={`/admin/productos/${p.id}`}
                    aria-label={content.editLabel(p.name)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border-trazo border-carbon px-4 text-14 font-semibold text-carbon no-underline"
                  >
                    <Icono nombre="editar" size={16} />
                    {content.edit}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="text-14 text-secundario">{content.help}</p>
      <Aviso aviso={aviso} onClose={cerrar} />
    </>
  );
}
