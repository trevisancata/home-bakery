// Inscripciones a workshops, guardadas en memoria del servidor.
//
// TODO(E5): reemplazar por la tabla `inscripciones` de Supabase. En memoria
// se pierden con cada reinicio o cold start (en Vercel, en cualquier
// momento) y cada instancia tiene su propia copia. En Supabase, el control de
// cupo y el alta tienen que ir juntos en una transacción (o una función RPC)
// para que dos inscripciones simultáneas no se lleven el mismo lugar.

import { workshops, type Workshop } from "@/data/workshops";
import type { Inscripcion } from "@/lib/validation/inscripcion";

type StoredInscripcion = Inscripcion & { id: string; createdAt: string };

type Store = { inscripciones: StoredInscripcion[]; reserved: Map<string, number> };

// En globalThis para que el hot reload de desarrollo no la vacíe.
const globalStore = globalThis as typeof globalThis & { __inscripciones?: Store };
const store: Store = (globalStore.__inscripciones ??= { inscripciones: [], reserved: new Map() } satisfies Store);

/**
 * Lugares libres: los que quedaban en data/workshops.ts menos los reservados
 * acá. Recibe el registro original, no uno que ya los tenga descontados.
 */
export function getSpotsLeft(workshop: Pick<Workshop, "slug" | "spotsLeft">) {
  return Math.max(0, workshop.spotsLeft - (store.reserved.get(workshop.slug) ?? 0));
}

export type CreateResult = { ok: true; id: string } | { ok: false; spotsLeft: number };

/**
 * Guarda la inscripción si hay cupo para todos los lugares pedidos. Quien
 * llama ya validó que el workshop exista y esté abierto.
 */
export async function createInscripcion(data: Inscripcion): Promise<CreateResult> {
  const workshop = workshops.find((item) => item.slug === data.workshopSlug);
  if (!workshop) return { ok: false, spotsLeft: 0 };

  // El chequeo y la reserva van sin await en el medio: no se intercalan.
  const spotsLeft = getSpotsLeft(workshop);
  if (data.spots > spotsLeft) return { ok: false, spotsLeft };

  const id = crypto.randomUUID();
  store.inscripciones.push({ ...data, id, createdAt: new Date().toISOString() });
  store.reserved.set(workshop.slug, (store.reserved.get(workshop.slug) ?? 0) + data.spots);
  return { ok: true, id };
}
