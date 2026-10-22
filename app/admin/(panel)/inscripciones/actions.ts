"use server";

import { accion } from "@/lib/admin/accion";
import { cambiarEstadoInscripcion } from "@/lib/admin/inscripciones";
import { marcarDevuelto as marcarDevueltoServicio } from "@/lib/admin/pagos";
import { inscripcionUpdateSchema, parseId } from "@/lib/admin/schemas";

/** Pendiente de seña / Reservada / Cancelada, con cambiar_estado_inscripcion (respeta el cupo). */
export async function cambiarEstado(id: string, status: string) {
  return accion("Error al cambiar el estado de la inscripción", async (supabase) => {
    const datos = inscripcionUpdateSchema.parse({ status });
    const inscripcion = await cambiarEstadoInscripcion(supabase, parseId(id, "La inscripción no existe."), datos.status);
    return { status: inscripcion.status };
  });
}

/** Marca como devuelto un pago que estaba "para devolver" (migración 0005). */
export async function marcarDevuelto(pagoId: string) {
  return accion("Error al marcar el pago como devuelto", async (supabase) => {
    await marcarDevueltoServicio(supabase, pagoId);
    return { devueltoAt: new Date().toISOString() };
  });
}
