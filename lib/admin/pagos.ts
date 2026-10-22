import "server-only";
import { fromDbError } from "@/lib/admin/errors";
import { parseId } from "@/lib/admin/schemas";
import type { AuthClient } from "@/lib/auth";

// Inscripciones con su pago para el panel. Con el cliente de la sesión: RLS
// deja leer inscripciones y pagos solo a la admin.

export type PagoAdmin = {
  id: string;
  mpPaymentId: string;
  estado: string;
  monto: number;
  devolucionPendiente: boolean;
  motivoDevolucion: string | null;
  /** Cuándo la marcó como devuelta la admin (migración 0005). */
  devueltoAt: string | null;
  createdAt: string;
};

export type InscripcionConPagos = {
  id: string;
  createdAt: string;
  nombre: string;
  whatsapp: string;
  email: string;
  experiencia: string | null;
  alergias: string | null;
  comoNosConocio: string | null;
  cantidad: number;
  estado: string;
  montoSena: number | null;
  /** Pendiente de seña y ya vencida: no ocupa lugar. */
  vencida: boolean;
  workshop: string;
  workshopId: string;
  workshopSlug: string;
  pagos: PagoAdmin[];
};

type Row = {
  id: string;
  created_at: string;
  nombre: string;
  whatsapp: string;
  email: string;
  experiencia: string | null;
  alergias: string | null;
  como_nos_conocio: string | null;
  cantidad: number;
  estado: string;
  monto_sena: number | string | null;
  vence_at: string;
  workshop: { id: string; slug: string; nombre: string };
  pagos: {
    id: string;
    mp_payment_id: string;
    estado: string;
    monto: number | string;
    devolucion_pendiente: boolean;
    motivo_devolucion: string | null;
    devuelto_at: string | null;
    created_at: string;
  }[];
};

/** Las últimas 200 inscripciones (o las de un workshop), de la más nueva a la más vieja. */
export async function listarInscripcionesConPagos(
  supabase: AuthClient,
  { workshopId }: { workshopId?: string } = {},
): Promise<InscripcionConPagos[]> {
  let query = supabase
    .from("inscripciones")
    .select(
      "id, created_at, nombre, whatsapp, email, experiencia, alergias, como_nos_conocio, cantidad, estado, monto_sena, vence_at, workshop:workshops!inner (id, slug, nombre), pagos (id, mp_payment_id, estado, monto, devolucion_pendiente, motivo_devolucion, devuelto_at, created_at)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (workshopId) query = query.eq("workshop_id", workshopId);
  const { data, error } = await query;
  if (error) throw fromDbError(error);
  const ahora = Date.now();
  return (data as unknown as Row[]).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    nombre: row.nombre,
    whatsapp: row.whatsapp,
    email: row.email,
    experiencia: row.experiencia,
    alergias: row.alergias,
    comoNosConocio: row.como_nos_conocio,
    cantidad: row.cantidad,
    estado: row.estado,
    montoSena: row.monto_sena === null ? null : Number(row.monto_sena),
    vencida: row.estado === "pendiente_sena" && new Date(row.vence_at).getTime() <= ahora,
    workshop: row.workshop.nombre,
    workshopId: row.workshop.id,
    workshopSlug: row.workshop.slug,
    pagos: [...row.pagos]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((pago) => ({
        id: pago.id,
        mpPaymentId: pago.mp_payment_id,
        estado: pago.estado,
        monto: Number(pago.monto),
        devolucionPendiente: pago.devolucion_pendiente,
        motivoDevolucion: pago.motivo_devolucion,
        devueltoAt: pago.devuelto_at,
        createdAt: pago.created_at,
      })),
  }));
}

/**
 * Marca como devuelto un pago que estaba "para devolver" (la devolución se
 * hace a mano desde Mercado Pago). La función de la base exige es_admin() y
 * guarda cuándo y quién (migración 0005).
 */
export async function marcarDevuelto(supabase: AuthClient, pagoId: string) {
  const id = parseId(pagoId, "El pago no existe.");
  const { error } = await supabase.rpc("marcar_devuelto", { p_pago_id: id });
  if (error) throw fromDbError(error, "El pago no existe o ya no está para devolver.");
}
