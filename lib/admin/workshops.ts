import "server-only";
import { ConflictError, fromDbError, NotFoundError } from "@/lib/admin/errors";
import { type AdminImage, toAdminImage } from "@/lib/admin/imagenes";
import { revalidarWorkshops } from "@/lib/admin/revalidar";
import type { WorkshopCreate, WorkshopUpdate } from "@/lib/admin/schemas";
import { uniqueSlug } from "@/lib/admin/slug";
import type { AuthClient } from "@/lib/auth";

// Workshops desde el panel, con el cliente de la sesión de la admin (RLS).

export type AdminWorkshop = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  level: string | null;
  includes: string | null;
  startsAt: string;
  durationMinutes: number;
  price: number | null;
  depositPercent: number;
  capacity: number;
  minimum: number;
  active: boolean;
  featured: boolean;
  isExample: boolean;
  /** Lugares ocupados, igual que lugares_ocupados(): reservadas y pendientes que no vencieron. */
  spotsTaken: number;
  /** Lugares de las inscripciones reservadas (con el pago aprobado). */
  spotsReserved: number;
  /** Cuántas inscripciones tiene (también las canceladas). */
  inscripciones: number;
  images: AdminImage[];
  createdAt: string;
  updatedAt: string;
};

type WorkshopRow = {
  id: string;
  slug: string;
  nombre: string;
  resumen: string | null;
  descripcion: string | null;
  nivel: string | null;
  incluye: string | null;
  fecha_inicio: string;
  duracion_min: number;
  precio: number | string | null;
  sena_porcentaje: number;
  cupo: number;
  cupo_minimo: number;
  activo: boolean;
  destacado: boolean;
  es_ejemplo: boolean;
  created_at: string;
  updated_at: string;
  inscripciones: { cantidad: number; estado: string; vence_at: string }[];
  workshop_imagenes: { id: string; ruta: string; alt: string; ancho: number; alto: number; portada: boolean; orden: number }[];
};

const workshopSelect = `
  id, slug, nombre, resumen, descripcion, nivel, incluye, fecha_inicio, duracion_min,
  precio, sena_porcentaje, cupo, cupo_minimo, activo, destacado, es_ejemplo,
  created_at, updated_at,
  inscripciones (cantidad, estado, vence_at),
  workshop_imagenes (id, ruta, alt, ancho, alto, portada, orden)
`;

const notFound = "El workshop no existe.";

const suma = (filas: { cantidad: number }[]) => filas.reduce((total, fila) => total + fila.cantidad, 0);

function toAdminWorkshop(row: WorkshopRow, ahora = Date.now()): AdminWorkshop {
  return {
    id: row.id,
    slug: row.slug,
    name: row.nombre,
    summary: row.resumen,
    description: row.descripcion,
    level: row.nivel,
    includes: row.incluye,
    startsAt: row.fecha_inicio,
    durationMinutes: row.duracion_min,
    price: row.precio === null ? null : Number(row.precio),
    depositPercent: row.sena_porcentaje,
    capacity: row.cupo,
    minimum: row.cupo_minimo,
    active: row.activo,
    featured: row.destacado,
    isExample: row.es_ejemplo,
    spotsTaken: suma(
      row.inscripciones.filter(
        (i) => i.estado === "reservada" || (i.estado === "pendiente_sena" && new Date(i.vence_at).getTime() > ahora),
      ),
    ),
    spotsReserved: suma(row.inscripciones.filter((i) => i.estado === "reservada")),
    inscripciones: row.inscripciones.length,
    images: [...row.workshop_imagenes].sort((a, b) => a.orden - b.orden).map((img) => toAdminImage("workshops", img)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: WorkshopUpdate) {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.nombre = input.name;
  if (input.summary !== undefined) row.resumen = input.summary;
  if (input.description !== undefined) row.descripcion = input.description;
  if (input.level !== undefined) row.nivel = input.level;
  if (input.includes !== undefined) row.incluye = input.includes;
  if (input.startsAt !== undefined) row.fecha_inicio = input.startsAt;
  if (input.durationMinutes !== undefined) row.duracion_min = input.durationMinutes;
  if (input.price !== undefined) row.precio = input.price;
  if (input.depositPercent !== undefined) row.sena_porcentaje = input.depositPercent;
  if (input.capacity !== undefined) row.cupo = input.capacity;
  if (input.minimum !== undefined) row.cupo_minimo = input.minimum;
  if (input.active !== undefined) row.activo = input.active;
  if (input.featured !== undefined) row.destacado = input.featured;
  if (input.isExample !== undefined) row.es_ejemplo = input.isExample;
  return row;
}

/** Todos los workshops (también inactivos y pasados), del más nuevo al más viejo. */
export async function listarWorkshops(supabase: AuthClient) {
  const { data, error } = await supabase
    .from("workshops")
    .select(workshopSelect)
    .order("fecha_inicio", { ascending: false });
  if (error) throw fromDbError(error);
  return (data as unknown as WorkshopRow[]).map((row) => toAdminWorkshop(row));
}

async function obtenerRow(supabase: AuthClient, id: string) {
  const { data, error } = await supabase.from("workshops").select(workshopSelect).eq("id", id).maybeSingle();
  if (error) throw fromDbError(error, notFound);
  if (!data) throw new NotFoundError(notFound);
  return data as unknown as WorkshopRow;
}

export async function obtenerWorkshop(supabase: AuthClient, id: string) {
  return toAdminWorkshop(await obtenerRow(supabase, id));
}

export async function crearWorkshop(supabase: AuthClient, input: WorkshopCreate) {
  const row = toRow(input);
  for (let attempt = 0; attempt < 2; attempt++) {
    const slug = await uniqueSlug(supabase, "workshops", input.name);
    const { data, error } = await supabase.from("workshops").insert({ ...row, slug }).select("id").single();
    if (!error) {
      revalidarWorkshops();
      return obtenerWorkshop(supabase, data.id);
    }
    if (error.code !== "23505" || attempt === 1) throw fromDbError(error);
  }
  throw new Error("No se pudo crear el workshop");
}

/** Edición parcial. Bajar el cupo por debajo de lo ocupado es un 409. */
export async function actualizarWorkshop(supabase: AuthClient, id: string, input: WorkshopUpdate) {
  const actual = await obtenerWorkshop(supabase, id);
  if (input.capacity !== undefined && input.capacity < actual.spotsTaken) {
    throw new ConflictError(
      `Ya hay ${actual.spotsTaken} lugares ocupados: el cupo no puede ser menor.`,
      Math.max(actual.capacity - actual.spotsTaken, 0),
    );
  }
  const { error } = await supabase.from("workshops").update(toRow(input)).eq("id", id);
  if (error) throw fromDbError(error, notFound);

  revalidarWorkshops();
  return obtenerWorkshop(supabase, id);
}

/**
 * Borra un workshop sin inscripciones (y sus fotos). Con inscripciones, 409:
 * son registros de personas y no se borran; se desactiva o se cancela.
 */
export async function borrarWorkshop(supabase: AuthClient, id: string) {
  const actual = await obtenerRow(supabase, id);
  if (actual.inscripciones.length > 0) {
    throw new ConflictError("Tiene inscripciones: desactivalo en lugar de borrarlo.");
  }
  const { error } = await supabase.from("workshops").delete().eq("id", id);
  // 23503: entró una inscripción entre la consulta y el borrado.
  if (error?.code === "23503") throw new ConflictError("Tiene inscripciones: desactivalo en lugar de borrarlo.");
  if (error) throw fromDbError(error, notFound);

  if (actual.workshop_imagenes.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("workshops")
      .remove(actual.workshop_imagenes.map((image) => image.ruta));
    if (storageError) console.error(`No se pudieron borrar las fotos del workshop (${storageError.name})`);
  }

  revalidarWorkshops();
}
