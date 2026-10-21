import "server-only";
import { fromDbError } from "@/lib/admin/errors";
import type { AuthClient } from "@/lib/auth";

// Inscripciones con su pago para el panel. Con el cliente de la sesión: RLS
// deja leer inscripciones y pagos solo a la admin.

export type PagoAdmin = {
  mpPaymentId: string;
  estado: string;
  monto: number;
  devolucionPendiente: boolean;
  motivoDevolucion: string | null;
  createdAt: string;
};

export type InscripcionConPagos = {
  id: string;
  createdAt: string;
  nombre: string;
  cantidad: number;
  estado: string;
  montoSena: number | null;
  /** Pendiente de seña y ya vencida: no ocupa lugar. */
  vencida: boolean;
  workshop: string;
  pagos: PagoAdmin[];
};

type Row = {
  id: string;
  created_at: string;
  nombre: string;
  cantidad: number;
  estado: string;
  monto_sena: number | string | null;
  vence_at: string;
  workshop: { nombre: string };
  pagos: {
    mp_payment_id: string;
    estado: string;
    monto: number | string;
    devolucion_pendiente: boolean;
    motivo_devolucion: string | null;
    created_at: string;
  }[];
};

/** Las últimas 200 inscripciones, de la más nueva a la más vieja. */
export async function listarInscripcionesConPagos(supabase: AuthClient): Promise<InscripcionConPagos[]> {
  const { data, error } = await supabase
    .from("inscripciones")
    .select(
      "id, created_at, nombre, cantidad, estado, monto_sena, vence_at, workshop:workshops!inner (nombre), pagos (mp_payment_id, estado, monto, devolucion_pendiente, motivo_devolucion, created_at)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw fromDbError(error);
  const ahora = Date.now();
  return (data as unknown as Row[]).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    nombre: row.nombre,
    cantidad: row.cantidad,
    estado: row.estado,
    montoSena: row.monto_sena === null ? null : Number(row.monto_sena),
    vencida: row.estado === "pendiente_sena" && new Date(row.vence_at).getTime() <= ahora,
    workshop: row.workshop.nombre,
    pagos: [...row.pagos]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((pago) => ({
        mpPaymentId: pago.mp_payment_id,
        estado: pago.estado,
        monto: Number(pago.monto),
        devolucionPendiente: pago.devolucion_pendiente,
        motivoDevolucion: pago.motivo_devolucion,
        createdAt: pago.created_at,
      })),
  }));
}
