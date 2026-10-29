// Esquema del pedido de la tienda. Es el mismo en el checkout (validación
// antes de enviar) y en POST /api/v1/pedidos (revalidación). No lleva
// precios: los calcula siempre la base (crear_pedido, migración 0007).
//
// La anticipación (depende de los productos) y el mínimo para el envío
// (depende del total) los revisan el checkout, con los datos del carrito, y
// la base, que es la fuente de verdad.

import { z } from "zod";
import { pedidos } from "@/data/site";
import { validarFechaFranja } from "@/lib/pedidos/reglas";

/** Los campos opcionales llegan como "" desde el formulario. */
const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max, { error: `Usá menos de ${max} caracteres.` }).optional());

export const pedidoItemSchema = z.object({
  productId: z.uuid({ error: "Producto no válido." }),
  sizeId: z.uuid({ error: "Tamaño no válido." }),
  flavor: optionalText(120),
  decoration: optionalText(120),
  quantity: z
    .number({ error: "Cantidad no válida." })
    .int({ error: "Cantidad no válida." })
    .min(1, { error: "La cantidad mínima es 1." })
    .max(pedidos.maxCantidad, { error: `Podés pedir hasta ${pedidos.maxCantidad} unidades de cada producto.` }),
});

export const pedidoSchema = z
  .object({
    name: z
      .string({ error: "Ingresá tu nombre y apellido." })
      .trim()
      .min(1, { error: "Ingresá tu nombre y apellido." })
      .min(2, { error: "El nombre es muy corto." })
      .max(100, { error: "El nombre es muy largo." }),
    email: z
      .string({ error: "Ingresá tu email." })
      .trim()
      .min(1, { error: "Ingresá tu email." })
      .pipe(z.email({ error: "Revisá el email: tiene que ser del estilo nombre@ejemplo.com." })),
    phone: z
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
    delivery: z.enum(["retiro", "envio"], { error: "Elegí cómo lo recibís." }),
    address: optionalText(200),
    locality: optionalText(80),
    date: z.string({ error: "Elegí un día." }),
    slot: z.string({ error: "Elegí un horario." }),
    notes: optionalText(500),
    items: z
      .array(pedidoItemSchema, { error: "El pedido está vacío." })
      .min(1, { error: "El pedido está vacío." })
      .max(pedidos.maxLineas, { error: `El pedido puede tener hasta ${pedidos.maxLineas} productos distintos.` }),
  })
  .superRefine((pedido, ctx) => {
    if (pedido.delivery === "envio") {
      if (!pedido.address) ctx.addIssue({ code: "custom", path: ["address"], message: "Ingresá la dirección." });
      if (!pedido.locality) ctx.addIssue({ code: "custom", path: ["locality"], message: "Ingresá la localidad." });
    }
    // La anticipación se valida con 0 h acá; con la de los productos, en el checkout y en la base.
    const fecha = validarFechaFranja(pedido.date, pedido.slot, 0);
    if (fecha) ctx.addIssue({ code: "custom", path: [fecha.field], message: fecha.message });
  });

export type PedidoInput = z.input<typeof pedidoSchema>;
export type Pedido = z.output<typeof pedidoSchema>;
export type PedidoField = "name" | "email" | "phone" | "delivery" | "address" | "locality" | "date" | "slot" | "notes" | "items";
export type PedidoFieldErrors = Partial<Record<PedidoField, string>>;

/** El primer error de cada campo (los de los ítems, en "items"), listo para mostrar debajo del input. */
export function pedidoFieldErrors(error: z.ZodError): PedidoFieldErrors {
  const result: PedidoFieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "items") as PedidoField;
    if (!result[field]) result[field] = issue.message;
  }
  return result;
}
