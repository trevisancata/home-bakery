// Esquemas de lo que se puede crear y editar desde el panel. Los usan la API
// de admin (app/api/v1/admin) y las Server Actions del panel: la validación
// del servidor es siempre esta, venga de donde venga el pedido.
//
// Los textos se sanean: sin caracteres de control, con trim y sin etiquetas
// HTML (se rechazan, no se borran en silencio). React ya escapa todo al
// renderizar; esto evita guardar basura y HTML que otro cliente podría
// mostrar sin escapar.

import { z } from "zod";
import { NotFoundError } from "@/lib/admin/errors";

// Mensajes por defecto de zod en español, para cualquier campo que no
// tenga uno propio (los del panel tienen uno propio, más claro).
z.config(z.locales.es());

// Caracteres de control, salvo salto de línea y tabulación.
const controlChars = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const htmlTag = /<\s*\/?\s*[a-z!?][^>]*>/i;

/** Texto obligatorio, saneado, de hasta `max` caracteres. */
export const texto = (max: number) =>
  z
    .string({ error: "Tiene que ser un texto." })
    .transform((value) => value.replace(controlChars, "").trim())
    .pipe(
      z
        .string()
        .min(1, { error: "Completá este campo." })
        .max(max, { error: `Usá hasta ${max} caracteres.` })
        .refine((value) => !htmlTag.test(value), { error: "No uses etiquetas HTML." }),
    );

/**
 * Texto opcional: "" o null lo borran (null en la base), ausente no lo toca.
 */
export const textoOpcional = (max: number) =>
  z
    .preprocess((value) => (typeof value === "string" && value.trim() === "" ? null : value), texto(max).nullable())
    .optional();

const mes = z
  .number({ error: "Elegí un mes." })
  .int({ error: "Elegí un mes." })
  .min(1, { error: "Elegí un mes." })
  .max(12, { error: "Elegí un mes." });
const precio = z
  .number({ error: "El precio tiene que ser un número." })
  .min(0, { error: "El precio no puede ser negativo." })
  .max(100_000_000, { error: "El precio es demasiado alto." })
  .multipleOf(0.01, { error: "Usá hasta dos decimales." })
  .nullable();
const orden = z
  .number({ error: "El orden tiene que ser un número." })
  .int({ error: "El orden tiene que ser un número entero." })
  .min(0, { error: "El orden no puede ser negativo." })
  .max(100_000);

/* -------------------------------------------------------------------------- */
/* Productos                                                                  */
/* -------------------------------------------------------------------------- */

export const tamanoSchema = z.strictObject({
  label: texto(80),
  /** null = "Precio a confirmar". */
  price: precio,
});

const productoCampos = {
  name: texto(120),
  categoryId: z.uuid({ error: "Elegí una categoría." }),
  description: textoOpcional(2000),
  measure: textoOpcional(120),
  servings: textoOpcional(120),
  weight: textoOpcional(120),
  presentation: textoOpcional(120),
  /** null = todo el año. */
  season: z.strictObject({ from: mes, to: mes }).nullable().optional(),
  custom: z.boolean().optional(),
  leadTimeHours: z
    .number({ error: "Escribí la anticipación en horas." })
    .int({ error: "Escribí la anticipación en horas enteras." })
    .min(0, { error: "Escribí la anticipación en horas." })
    .max(24 * 60, { error: "La anticipación es de hasta 60 días." })
    .optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  order: orden.optional(),
  flavors: z.array(texto(80)).max(30).optional(),
  decorations: z.array(texto(80)).max(30).optional(),
  /** Reemplaza todos los tamaños del producto, en este orden. */
  sizes: z
    .array(tamanoSchema)
    .max(20)
    .refine((sizes) => new Set(sizes.map((size) => size.label.toLowerCase())).size === sizes.length, {
      error: "Hay dos tamaños con el mismo nombre.",
    })
    .optional(),
};

/** Alta: name y categoryId obligatorios. strict: un campo desconocido es un 400. */
export const productoCreateSchema = z.strictObject(productoCampos);

/** Edición parcial (PATCH): al menos un campo. */
export const productoUpdateSchema = z
  .strictObject(productoCampos)
  .partial()
  .refine((value) => Object.keys(value).length > 0, { error: "No hay nada para cambiar." });

export type ProductoCreate = z.output<typeof productoCreateSchema>;
export type ProductoUpdate = z.output<typeof productoUpdateSchema>;

/** Datos que acompañan una foto nueva (multipart). */
export const imagenCreateSchema = z.strictObject({
  /** Texto alternativo: describe la foto para quien no la ve. */
  alt: texto(200),
  flavor: textoOpcional(80),
});

export const imagenUpdateSchema = z
  .strictObject({
    alt: texto(200).optional(),
    flavor: textoOpcional(80),
    order: orden.optional(),
    /** true la vuelve portada (y la anterior deja de serlo). */
    cover: z.literal(true, { error: "Para cambiar la portada, marcá otra foto como portada." }).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { error: "No hay nada para cambiar." });

export type ImagenUpdate = z.output<typeof imagenUpdateSchema>;

/* -------------------------------------------------------------------------- */
/* Workshops                                                                  */
/* -------------------------------------------------------------------------- */

const workshopCampos = {
  name: texto(120),
  summary: textoOpcional(300),
  description: textoOpcional(4000),
  level: z.enum(["Inicial", "Intermedio"], { error: "El nivel es Inicial o Intermedio." }).nullable().optional(),
  includes: textoOpcional(500),
  /** Fecha y hora de inicio, ISO con zona horaria (2026-11-14T15:00:00-03:00). */
  startsAt: z.iso.datetime({ offset: true, error: "Elegí la fecha y la hora." }),
  durationMinutes: z
    .number({ error: "Escribí la duración en minutos." })
    .int({ error: "Escribí la duración en minutos enteros." })
    .min(15, { error: "La duración es de al menos 15 minutos." })
    .max(24 * 60, { error: "La duración es de hasta 24 horas." })
    .optional(),
  price: precio.optional(),
  depositPercent: z
    .number({ error: "Escribí el porcentaje del pago." })
    .int({ error: "Escribí un porcentaje entero." })
    .min(1, { error: "El pago es de 1 a 100%." })
    .max(100, { error: "El pago es de 1 a 100%." })
    .optional(),
  capacity: z
    .number({ error: "El cupo tiene que ser un número." })
    .int({ error: "El cupo tiene que ser un número entero." })
    .min(1, { error: "El cupo es de al menos 1 persona." })
    .max(8, { error: "El cupo es de hasta 8 personas." })
    .optional(),
  minimum: z
    .number({ error: "El mínimo tiene que ser un número." })
    .int({ error: "El mínimo tiene que ser un número entero." })
    .min(1, { error: "El mínimo es de al menos 1 persona." })
    .max(8, { error: "El mínimo es de hasta 8 personas." })
    .optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  isExample: z.boolean().optional(),
};

const minimoHastaCupo = (value: { capacity?: number; minimum?: number }) =>
  value.capacity === undefined || value.minimum === undefined || value.minimum <= value.capacity;
const minimoError = { error: "El mínimo no puede ser mayor que el cupo.", path: ["minimum"] };

export const workshopCreateSchema = z.strictObject(workshopCampos).refine(minimoHastaCupo, minimoError);

export const workshopUpdateSchema = z
  .strictObject(workshopCampos)
  .partial()
  .refine((value) => Object.keys(value).length > 0, { error: "No hay nada para cambiar." })
  .refine(minimoHastaCupo, minimoError);

export type WorkshopCreate = z.output<typeof workshopCreateSchema>;
export type WorkshopUpdate = z.output<typeof workshopUpdateSchema>;

/* -------------------------------------------------------------------------- */
/* Inscripciones                                                              */
/* -------------------------------------------------------------------------- */

export const inscripcionStatuses = ["pendiente_sena", "reservada", "cancelada"] as const;

export const inscripcionUpdateSchema = z.strictObject({
  status: z.enum(inscripcionStatuses, { error: "El estado es pendiente_sena, reservada o cancelada." }),
});

/* -------------------------------------------------------------------------- */
/* Ids                                                                        */
/* -------------------------------------------------------------------------- */

/** Un id que no es uuid no puede existir: 404, no 400. */
export function parseId(value: string, notFound = "No existe.") {
  const parsed = z.uuid().safeParse(value);
  if (!parsed.success) throw new NotFoundError(notFound);
  return parsed.data;
}
