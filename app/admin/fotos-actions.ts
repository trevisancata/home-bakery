"use server";

import { accion } from "@/lib/admin/accion";
import { BadRequestError } from "@/lib/admin/errors";
import {
  actualizarImagen,
  type AdminImage,
  borrarImagen,
  type Destino,
  reordenarImagenes,
  subirImagen,
} from "@/lib/admin/imagenes";
import { imagenCreateSchema, imagenUpdateSchema, parseId } from "@/lib/admin/schemas";

// Fotos de productos y workshops desde el panel (componente Fotos).

const destinos = new Set<Destino>(["productos", "workshops"]);

function destinoValido(destino: string): Destino {
  if (!destinos.has(destino as Destino)) throw new BadRequestError("Destino de la foto inválido.");
  return destino as Destino;
}

/** FormData: file, alt, flavor (opcional). */
export async function subirFoto(destino: string, ownerId: string, formData: FormData) {
  return accion<AdminImage>("Error al subir la foto", async (supabase) => {
    const file = formData.get("file");
    if (!(file instanceof File)) throw new BadRequestError("Elegí una foto.", { file: "Elegí una foto." });
    const meta = imagenCreateSchema.parse({
      alt: formData.get("alt") ?? undefined,
      flavor: formData.get("flavor") ?? undefined,
    });
    return subirImagen(supabase, destinoValido(destino), parseId(ownerId), file, meta);
  });
}

export async function actualizarFoto(destino: string, ownerId: string, imagenId: string, datos: unknown) {
  return accion<AdminImage>("Error al editar la foto", async (supabase) =>
    actualizarImagen(supabase, destinoValido(destino), parseId(ownerId), parseId(imagenId, "La foto no existe."), imagenUpdateSchema.parse(datos)),
  );
}

export async function ordenarFotos(destino: string, ownerId: string, ids: string[]) {
  return accion("Error al ordenar las fotos", async (supabase) => {
    await reordenarImagenes(supabase, destinoValido(destino), parseId(ownerId), ids.map((id) => parseId(id, "La foto no existe.")));
    return null;
  });
}

export async function borrarFoto(destino: string, ownerId: string, imagenId: string) {
  return accion("Error al borrar la foto", async (supabase) => {
    await borrarImagen(supabase, destinoValido(destino), parseId(ownerId), parseId(imagenId, "La foto no existe."));
    return null;
  });
}
