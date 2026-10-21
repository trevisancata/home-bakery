import "server-only";
import { conciliarInscripcion } from "@/lib/pagos/conciliar";
import type { InscripcionVista } from "@/lib/pagos/vista";
import { createAdminClient } from "@/lib/supabase/admin";

// Lectura de una inscripción para la página de resultado del pago. Usa la
// secret key porque anon no puede leer inscripciones; trae solo lo que la
// página muestra, nunca los datos personales.

export type Resultado = InscripcionVista & {
  id: string;
  cantidad: number;
  montoSena: number | null;
  initPoint: string | null;
  workshop: { slug: string; nombre: string; fechaInicio: string; duracionMin: number };
};

type Row = {
  id: string;
  estado: string;
  cantidad: number;
  monto_sena: number | string | null;
  vence_at: string;
  mp_init_point: string | null;
  workshop: { slug: string; nombre: string; fecha_inicio: string; duracion_min: number };
  pagos: { estado: string; devolucion_pendiente: boolean; created_at: string }[];
};

async function leer(id: string): Promise<Resultado | null> {
  const { data, error } = await createAdminClient()
    .from("inscripciones")
    .select(
      "id, estado, cantidad, monto_sena, vence_at, mp_init_point, workshop:workshops!inner (slug, nombre, fecha_inicio, duracion_min), pagos (estado, devolucion_pendiente, created_at)",
    )
    .eq("id", id)
    // Next memoiza los fetch GET iguales dentro de un render: sin esto, la
    // segunda lectura (después de conciliar) devolvería la primera.
    .abortSignal(new AbortController().signal)
    .maybeSingle<Row>();
  if (error) throw Object.assign(new Error("No se pudo leer la inscripción"), { code: error.code });
  if (!data) return null;
  return {
    id: data.id,
    estado: data.estado,
    cantidad: data.cantidad,
    montoSena: data.monto_sena === null ? null : Number(data.monto_sena),
    venceAt: data.vence_at,
    initPoint: data.mp_init_point,
    workshop: {
      slug: data.workshop.slug,
      nombre: data.workshop.nombre,
      fechaInicio: data.workshop.fecha_inicio,
      duracionMin: data.workshop.duracion_min,
    },
    pagos: data.pagos.map((pago) => ({
      estado: pago.estado,
      devolucionPendiente: pago.devolucion_pendiente,
      createdAt: pago.created_at,
    })),
  };
}

/**
 * Estado real de la inscripción. Si sigue pendiente, primero concilia con
 * Mercado Pago (por si el webhook no llegó o llega tarde) y vuelve a leer.
 */
export async function resultadoInscripcion(id: string) {
  const inscripcion = await leer(id);
  if (!inscripcion || inscripcion.estado !== "pendiente_sena") return inscripcion;
  try {
    await conciliarInscripcion(id);
  } catch (error) {
    // Si MP no responde, se muestra lo que hay: la página se refresca sola.
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "sin código";
    console.error(`No se pudo conciliar la inscripción con Mercado Pago (${code})`);
    return inscripcion;
  }
  return leer(id);
}
