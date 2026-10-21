import "server-only";
import { fromDbError, NotFoundError } from "@/lib/admin/errors";
import { revalidarWorkshops } from "@/lib/admin/revalidar";
import type { inscripcionStatuses } from "@/lib/admin/schemas";
import { obtenerWorkshop } from "@/lib/admin/workshops";
import type { AuthClient } from "@/lib/auth";

// Inscripciones desde el panel: tienen datos personales, así que solo las lee
// la admin (RLS) y las respuestas nunca se cachean. No se borran: se cancelan.

export type InscripcionStatus = (typeof inscripcionStatuses)[number];

export type AdminInscripcion = {
  id: string;
  workshopId: string;
  name: string;
  whatsapp: string;
  email: string;
  experience: string | null;
  allergies: string | null;
  referral: string | null;
  spots: number;
  status: InscripcionStatus;
  createdAt: string;
  updatedAt: string;
};

type InscripcionRow = {
  id: string;
  workshop_id: string;
  nombre: string;
  whatsapp: string;
  email: string;
  experiencia: string | null;
  alergias: string | null;
  como_nos_conocio: string | null;
  cantidad: number;
  estado: InscripcionStatus;
  created_at: string;
  updated_at: string;
};

const inscripcionSelect =
  "id, workshop_id, nombre, whatsapp, email, experiencia, alergias, como_nos_conocio, cantidad, estado, created_at, updated_at";

const notFound = "La inscripción no existe.";

function toAdminInscripcion(row: InscripcionRow): AdminInscripcion {
  return {
    id: row.id,
    workshopId: row.workshop_id,
    name: row.nombre,
    whatsapp: row.whatsapp,
    email: row.email,
    experience: row.experiencia,
    allergies: row.alergias,
    referral: row.como_nos_conocio,
    spots: row.cantidad,
    status: row.estado,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Inscripciones de un workshop, de la más vieja a la más nueva. */
export async function listarInscripciones(supabase: AuthClient, workshopId: string) {
  await obtenerWorkshop(supabase, workshopId);
  const { data, error } = await supabase
    .from("inscripciones")
    .select(inscripcionSelect)
    .eq("workshop_id", workshopId)
    .order("created_at");
  if (error) throw fromDbError(error);
  return (data as InscripcionRow[]).map(toAdminInscripcion);
}

/**
 * Cambia el estado con cambiar_estado_inscripcion: si una cancelada vuelve a
 * estar activa y ya no hay lugar, 409 con los lugares libres.
 */
export async function cambiarEstadoInscripcion(supabase: AuthClient, id: string, status: InscripcionStatus) {
  const { error } = await supabase.rpc("cambiar_estado_inscripcion", { p_id: id, p_estado: status });
  if (error) throw fromDbError(error, notFound);

  const { data, error: readError } = await supabase.from("inscripciones").select(inscripcionSelect).eq("id", id).maybeSingle();
  if (readError) throw fromDbError(readError, notFound);
  if (!data) throw new NotFoundError(notFound);

  revalidarWorkshops();
  return toAdminInscripcion(data as InscripcionRow);
}
