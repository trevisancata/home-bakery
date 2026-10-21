import { BadGatewayError, fromDbError, TooManyRequestsError } from "@/lib/admin/errors";
import { revalidarWorkshops } from "@/lib/admin/revalidar";
import { ok, readJson, withApi } from "@/lib/api";
import { crearPreferencia } from "@/lib/mercadopago";
import { armarPreferencia } from "@/lib/pagos/preferencia";
import { clientIp, inscripcionesLimiter } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { inscripcionSchema } from "@/lib/validation/inscripcion";

type InscripcionCreada = {
  inscripcion_id: string;
  monto_sena: number | string;
  vence_at: string;
  workshop_nombre: string;
  sena_porcentaje: number;
};

/**
 * POST /api/v1/inscripciones: crea la inscripción y la preferencia de pago
 * de la seña en Mercado Pago.
 *
 * 1. crear_inscripcion (Supabase) bloquea el workshop, valida el cupo,
 *    calcula la seña y guarda la inscripción pendiente por 30 minutos. Solo
 *    la puede ejecutar service_role (migración 0004): se llama con la
 *    secret key, después de validar el pedido y el rate limit.
 * 2. Con la seña que calculó la base, se crea la preferencia de Checkout Pro.
 *
 * 201 { data: { id, initPoint } } · 400 { error: { message, fields } } · 404 ·
 * 409 { error: { message, spotsLeft } } · 422 sin precio · 429 · 502 si falla MP · 500
 */
export const POST = withApi("Error al guardar la inscripción", async (request) => {
  const inscripcion = inscripcionSchema.parse(await readJson(request));

  // Se cuentan solo los pedidos válidos: corregir un error del formulario no gasta intentos.
  const ip = clientIp(request.headers);
  const minutes = inscripcionesLimiter.blockedMinutes(ip);
  if (minutes !== null) {
    throw new TooManyRequestsError(
      `Hiciste varias inscripciones seguidas. Probá de nuevo en ${minutes === 1 ? "1 minuto" : `${minutes} minutos`}.`,
      minutes * 60,
    );
  }
  inscripcionesLimiter.hit(ip);

  const admin = createAdminClient();
  const { data, error } = await admin
    .rpc("crear_inscripcion", {
      p_workshop_slug: inscripcion.workshopSlug,
      p_nombre: inscripcion.name,
      p_whatsapp: inscripcion.whatsapp,
      p_email: inscripcion.email,
      p_cantidad: inscripcion.spots,
      p_acepta_politica: inscripcion.acceptsPolicy,
      p_experiencia: inscripcion.experience ?? null,
      p_alergias: inscripcion.allergies ?? null,
      p_como_nos_conocio: inscripcion.referral ?? null,
    })
    .single<InscripcionCreada>();
  // HB404, HB409 y HB422 los lanza crear_inscripcion; 23514 y 22xxx son
  // checks de la tabla que el esquema zod no cubrió.
  if (error) throw fromDbError(error, "El workshop no existe o ya no tiene inscripción abierta.");

  const id = data.inscripcion_id;

  let preferencia: { id: string; initPoint: string };
  try {
    preferencia = await crearPreferencia(
      armarPreferencia({
        inscripcion: {
          id,
          email: inscripcion.email,
          cantidad: inscripcion.spots,
          montoSena: Number(data.monto_sena),
          venceAt: data.vence_at,
        },
        workshop: { slug: inscripcion.workshopSlug, nombre: data.workshop_nombre, senaPorcentaje: data.sena_porcentaje },
        baseUrl: siteUrl(),
      }),
    );
  } catch (mpError) {
    // Sin link de pago la inscripción no sirve: se cancela para liberar el
    // cupo ya, sin esperar los 30 minutos.
    const status = typeof mpError === "object" && mpError && "status" in mpError ? String(mpError.status) : "sin status";
    console.error(`Error al crear la preferencia de Mercado Pago (${status})`);
    await admin.from("inscripciones").update({ estado: "cancelada" }).eq("id", id);
    throw new BadGatewayError("No pudimos iniciar el pago. Probá de nuevo en un rato.");
  }

  // Para reintentar el pago desde la página de resultado.
  const { error: updateError } = await admin
    .from("inscripciones")
    .update({ mp_preference_id: preferencia.id, mp_init_point: preferencia.initPoint })
    .eq("id", id);
  if (updateError) console.error(`No se pudo guardar la preferencia de la inscripción (${updateError.code})`);

  // Cambiaron los lugares libres que muestran el inicio y /workshops.
  revalidarWorkshops();
  return ok({ id, initPoint: preferencia.initPoint }, { status: 201, cache: false });
});
