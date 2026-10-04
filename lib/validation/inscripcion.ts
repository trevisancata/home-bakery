// Esquema de la inscripción a un workshop. Es el mismo en el formulario
// (validación antes de enviar) y en POST /api/inscripciones (revalidación).

import { z } from "zod";

export const experienceOptions = ["Ninguna", "Algo en casa", "Bastante"] as const;

export const referralOptions = [
  "Me lo recomendó alguien",
  "Instagram",
  "Ya hice un workshop",
  "Otro",
] as const;

/** Cupo máximo de un workshop (hasta 8 personas); el real es el cupo libre. */
export const maxSpotsPerInscripcion = 8;

/** Los campos opcionales llegan como "" desde el formulario. */
const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

export const inscripcionSchema = z.object({
  workshopSlug: z.string({ error: "Falta el workshop." }).min(1, { error: "Falta el workshop." }),
  name: z
    .string({ error: "Ingresá tu nombre y apellido." })
    .trim()
    .min(1, { error: "Ingresá tu nombre y apellido." })
    .min(2, { error: "El nombre es muy corto." })
    .max(100, { error: "El nombre es muy largo." }),
  whatsapp: z
    .string({ error: "Ingresá tu WhatsApp." })
    .trim()
    .min(1, { error: "Ingresá tu WhatsApp." })
    .regex(/^[\d\s()+-]+$/, { error: "Usá solo números, espacios o guiones." })
    .refine(
      (value) => {
        const digits = value.replace(/\D/g, "").length;
        return digits >= 8 && digits <= 15;
      },
      { error: "Revisá el número: tiene que tener entre 8 y 15 dígitos, con código de área." },
    ),
  email: z
    .string({ error: "Ingresá tu email." })
    .trim()
    .min(1, { error: "Ingresá tu email." })
    .pipe(z.email({ error: "Revisá el email: tiene que ser del estilo nombre@ejemplo.com." })),
  experience: z.preprocess(
    emptyToUndefined,
    z.enum(experienceOptions, { error: "Elegí una de las opciones." }).optional(),
  ),
  allergies: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(500, { error: "Usá menos de 500 caracteres." }).optional(),
  ),
  referral: z.preprocess(
    emptyToUndefined,
    z.enum(referralOptions, { error: "Elegí una de las opciones." }).optional(),
  ),
  acceptsPolicy: z.literal(true, { error: "Tenés que aceptar la política de cancelación." }),
  spots: z
    .number({ error: "Elegí cuántos lugares querés." })
    .int({ error: "Elegí cuántos lugares querés." })
    .min(1, { error: "Elegí al menos 1 lugar." })
    .max(maxSpotsPerInscripcion, { error: `Podés reservar hasta ${maxSpotsPerInscripcion} lugares.` }),
});

export type InscripcionInput = z.input<typeof inscripcionSchema>;
export type Inscripcion = z.output<typeof inscripcionSchema>;
export type InscripcionField = keyof Inscripcion;
export type FieldErrors = Partial<Record<InscripcionField, string>>;

/** El primer error de cada campo, listo para mostrar debajo del input. */
export function fieldErrors(error: z.ZodError<InscripcionInput>): FieldErrors {
  const { fieldErrors: all } = z.flattenError(error);
  const result: FieldErrors = {};
  for (const [field, messages] of Object.entries(all) as [InscripcionField, string[] | undefined][]) {
    if (messages?.[0]) result[field] = messages[0];
  }
  return result;
}
