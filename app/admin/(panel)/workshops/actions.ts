"use server";

import { redirect } from "next/navigation";
import { accion, type Resultado } from "@/lib/admin/accion";
import { parseId, workshopCreateSchema, workshopUpdateSchema } from "@/lib/admin/schemas";
import {
  actualizarWorkshop,
  type AdminWorkshop,
  borrarWorkshop as borrarWorkshopServicio,
  crearWorkshop,
} from "@/lib/admin/workshops";

// Acciones de workshops del panel (accion(): sesión, rol, zod y errores).

export type GuardarWorkshopEstado = Resultado<AdminWorkshop> | null;

/** Crear o editar (useActionState). Al crear, pasa a la página del workshop para sumarle fotos. */
export async function guardarWorkshop(
  _prev: GuardarWorkshopEstado,
  payload: { id: string | null; datos: unknown },
): Promise<GuardarWorkshopEstado> {
  const resultado = await accion<AdminWorkshop>("Error al guardar el workshop", async (supabase) => {
    if (payload.id) {
      return actualizarWorkshop(supabase, parseId(payload.id, "El workshop no existe."), workshopUpdateSchema.parse(payload.datos));
    }
    return crearWorkshop(supabase, workshopCreateSchema.parse(payload.datos));
  });
  if (resultado.ok && !payload.id) redirect(`/admin/workshops/${resultado.data.id}?tab=datos&creado=1`);
  return resultado;
}

/** Ocultar (en lugar de borrar uno con inscripciones). */
export async function ocultarWorkshop(id: string) {
  return accion("Error al ocultar el workshop", async (supabase) => {
    await actualizarWorkshop(supabase, parseId(id, "El workshop no existe."), workshopUpdateSchema.parse({ active: false }));
    return null;
  });
}

/** Borrar (sin inscripciones; con inscripciones, 409 con el aviso). */
export async function borrarWorkshop(id: string) {
  const resultado = await accion("Error al borrar el workshop", async (supabase) => {
    await borrarWorkshopServicio(supabase, parseId(id, "El workshop no existe."));
    return null;
  });
  if (resultado.ok) redirect("/admin/workshops");
  return resultado;
}
