import { fromDbError } from "@/lib/admin/errors";
import { revalidarWorkshops } from "@/lib/admin/revalidar";
import { ok, readJson, withApi } from "@/lib/api";
import { createPublicClient } from "@/lib/supabase/server";
import { inscripcionSchema } from "@/lib/validation/inscripcion";

/**
 * POST /api/v1/inscripciones: alta de una inscripción a un workshop, vía la
 * función crear_inscripcion de Supabase. Bloquea el workshop, valida el cupo
 * e inserta en una sola transacción (ver docs/modelo-de-datos.md).
 *
 * 201 { data: { id } } · 400 { error: { message, fields } } · 404 { error } ·
 * 409 { error: { message, spotsLeft } } · 500 { error }
 */
export const POST = withApi("Error al guardar la inscripción", async (request) => {
  const inscripcion = inscripcionSchema.parse(await readJson(request));

  const { data, error } = await createPublicClient().rpc("crear_inscripcion", {
    p_workshop_slug: inscripcion.workshopSlug,
    p_nombre: inscripcion.name,
    p_whatsapp: inscripcion.whatsapp,
    p_email: inscripcion.email,
    p_cantidad: inscripcion.spots,
    p_acepta_politica: inscripcion.acceptsPolicy,
    p_experiencia: inscripcion.experience ?? null,
    p_alergias: inscripcion.allergies ?? null,
    p_como_nos_conocio: inscripcion.referral ?? null,
  });
  // HB404 y HB409 los lanza crear_inscripcion; 23514 y 22xxx son checks de
  // la tabla que el esquema zod no cubrió.
  if (error) throw fromDbError(error, "El workshop no existe o ya no tiene inscripción abierta.");

  // Cambiaron los lugares libres que muestran el inicio y /workshops.
  revalidarWorkshops();
  return ok({ id: data as string }, { status: 201, cache: false });
});
