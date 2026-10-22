"use server";

import { redirect } from "next/navigation";
import { accion } from "@/lib/admin/accion";
import { BadRequestError } from "@/lib/admin/errors";
import {
  actualizarPrecioTamano,
  actualizarProducto,
  type AdminProduct,
  borrarProducto as borrarProductoServicio,
  crearProducto,
} from "@/lib/admin/productos";
import { parseId, productoCreateSchema, productoUpdateSchema } from "@/lib/admin/schemas";
import { parsePrecio } from "@/lib/precio";

// Acciones de productos del panel. Cada una pasa por accion(): verifica la
// sesión y el rol, valida con los mismos esquemas zod que la API y revalida
// las páginas públicas (lo hacen los servicios de lib/admin).

/** Precio en línea de un tamaño. Vacío = "Precio a confirmar". */
export async function guardarPrecio(sizeId: string, texto: string) {
  return accion("Error al guardar el precio", async (supabase) => {
    const precio = parsePrecio(texto);
    if (Number.isNaN(precio)) throw new BadRequestError("Escribí solo números, por ejemplo 12.500.");
    return actualizarPrecioTamano(supabase, parseId(sizeId, "El tamaño no existe."), precio);
  });
}

/** Mostrar o pausar en la tienda. */
export async function cambiarVisibilidad(id: string, active: boolean) {
  return accion("Error al cambiar la visibilidad", async (supabase) => {
    const producto = await actualizarProducto(supabase, parseId(id, "El producto no existe."), productoUpdateSchema.parse({ active }));
    return { active: producto.active };
  });
}

/** Destacado en el inicio (hasta 4). */
export async function cambiarDestacado(id: string, featured: boolean) {
  return accion("Error al cambiar el destacado", async (supabase) => {
    const producto = await actualizarProducto(supabase, parseId(id, "El producto no existe."), productoUpdateSchema.parse({ featured }));
    return { featured: producto.featured };
  });
}

export type GuardarProductoEstado = Awaited<ReturnType<typeof guardarProductoAccion>> | null;

async function guardarProductoAccion(id: string | null, datos: unknown) {
  return accion<AdminProduct>("Error al guardar el producto", async (supabase) => {
    if (id) return actualizarProducto(supabase, parseId(id, "El producto no existe."), productoUpdateSchema.parse(datos));
    return crearProducto(supabase, productoCreateSchema.parse(datos));
  });
}

/**
 * Crear o editar desde el editor (useActionState). Al crear, pasa a la
 * página del producto para poder sumarle fotos.
 */
export async function guardarProducto(_prev: GuardarProductoEstado, payload: { id: string | null; datos: unknown }) {
  const resultado = await guardarProductoAccion(payload.id, payload.datos);
  if (resultado.ok && !payload.id) redirect(`/admin/productos/${resultado.data.id}?creado=1`);
  return resultado;
}

/** Borrar (después del diálogo de confirmación) y volver a la lista. */
export async function borrarProducto(id: string, nombre: string) {
  const resultado = await accion("Error al borrar el producto", async (supabase) => {
    await borrarProductoServicio(supabase, parseId(id, "El producto no existe."));
    return null;
  });
  if (resultado.ok) redirect(`/admin/productos?borrado=${encodeURIComponent(nombre)}`);
  return resultado;
}
