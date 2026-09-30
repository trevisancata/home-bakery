import { getWorkshop } from "@/lib/data";
import { createInscripcion } from "@/lib/inscripciones";
import { fieldErrors, inscripcionSchema } from "@/lib/validation/inscripcion";

/**
 * Alta de una inscripción a un workshop.
 *
 * 201 { id } · 400 { message, errors } · 404 { message } · 409 { message, spotsLeft } · 500 { message }
 */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ message: "La solicitud no es válida.", errors: {} }, { status: 400 });
    }

    const parsed = inscripcionSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { message: "Revisá los datos del formulario.", errors: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const workshop = await getWorkshop(parsed.data.workshopSlug);
    if (!workshop) {
      return Response.json({ message: "El workshop no existe o ya no tiene inscripción abierta." }, { status: 404 });
    }

    const result = await createInscripcion(parsed.data);
    if (!result.ok) {
      return Response.json(
        {
          message:
            result.spotsLeft === 0
              ? "Ya no quedan lugares en este workshop."
              : `No quedan lugares suficientes: ${result.spotsLeft === 1 ? "queda 1" : `quedan ${result.spotsLeft}`}.`,
          spotsLeft: result.spotsLeft,
        },
        { status: 409 },
      );
    }

    return Response.json({ id: result.id }, { status: 201 });
  } catch (error) {
    console.error("Error al guardar la inscripción", error);
    return Response.json({ message: "No pudimos guardar la inscripción. Probá de nuevo." }, { status: 500 });
  }
}
