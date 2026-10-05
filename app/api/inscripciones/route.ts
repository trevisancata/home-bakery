import { fail, ok, serverError } from "@/lib/api";
import { createPublicClient } from "@/lib/supabase/server";
import { fieldErrors, inscripcionSchema } from "@/lib/validation/inscripcion";

/**
 * Alta de una inscripción a un workshop, vía la función crear_inscripcion
 * de Supabase: bloquea el workshop, valida el cupo e inserta en una sola
 * transacción (ver docs/modelo-de-datos.md).
 *
 * 201 { data: { id } } · 400 { error: { message, fields } } · 404 { error } ·
 * 409 { error: { message, spotsLeft } } · 500 { error }
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, { message: "La solicitud no es válida.", fields: {} });
  }

  const parsed = inscripcionSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, { message: "Revisá los datos del formulario.", fields: fieldErrors(parsed.error) });
  }

  const inscripcion = parsed.data;
  try {
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

    if (error) {
      // HB404 y HB409 los lanza crear_inscripcion; 23514 y 22xxx son checks
      // de la tabla que el esquema zod no cubrió.
      if (error.code === "HB404") {
        return fail(404, { message: "El workshop no existe o ya no tiene inscripción abierta." });
      }
      if (error.code === "HB409") {
        const spotsLeft = Number(error.details) || 0;
        return fail(409, {
          message:
            spotsLeft === 0
              ? "Ya no quedan lugares en este workshop."
              : `No quedan lugares suficientes: ${spotsLeft === 1 ? "queda 1" : `quedan ${spotsLeft}`}.`,
          spotsLeft,
        });
      }
      if (error.code === "23514" || error.code?.startsWith("22")) {
        return fail(400, { message: "Revisá los datos del formulario.", fields: {} });
      }
      return serverError("Error al guardar la inscripción", error);
    }

    return ok({ id: data as string }, { status: 201, cache: false });
  } catch (error) {
    return serverError("Error al guardar la inscripción", error);
  }
}
