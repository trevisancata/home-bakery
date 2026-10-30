import { expect, test } from "@playwright/test";
import { carritoSchema, leerCarrito } from "../lib/carrito/esquema";
import { agregarLinea, claveLinea, type Linea } from "../lib/carrito/lineas";
import { armarPreferenciaPedido } from "../lib/pagos/preferencia";
import { leerReferencia, referenciaInscripcion, referenciaPedido } from "../lib/pagos/referencia";
import { vistaPedido } from "../lib/pagos/vista";
import {
  fechaMaxima,
  fechaMinima,
  franjasDelDia,
  franjasDisponibles,
  inicioFranja,
  puedeEnvio,
  validarFechaFranja,
} from "../lib/pedidos/reglas";
import { pedidoSchema } from "../lib/validation/pedido";

// Unitarios de los pedidos: no levantan navegador ni tocan la base ni Mercado Pago.

// Miércoles 28/10/2026, 15:00 en Buenos Aires.
const ahora = Date.parse("2026-10-28T15:00:00-03:00");
const uuid = "6f1c2d4e-8a9b-4c3d-9e2f-1a2b3c4d5e6f";
const otro = "0b8f7c1d-2e3a-4b5c-8d9e-0f1a2b3c4d5e";

test.describe("Días y horarios", () => {
  test("lunes a viernes tres franjas, sábado una, domingo ninguna", () => {
    expect(franjasDelDia("2026-11-02")).toEqual(["10-13", "13-16", "16-19"]); // lunes
    expect(franjasDelDia("2026-11-06")).toEqual(["10-13", "13-16", "16-19"]); // viernes
    expect(franjasDelDia("2026-10-31")).toEqual(["9-13"]); // sábado
    expect(franjasDelDia("2026-11-01")).toEqual([]); // domingo
    expect(franjasDelDia("no-es-fecha")).toEqual([]);
  });

  test("la franja empieza a la hora de Buenos Aires", () => {
    expect(inicioFranja("2026-10-31", "9-13")).toBe(Date.parse("2026-10-31T09:00:00-03:00"));
    expect(inicioFranja("2026-11-02", "16-19")).toBe(Date.parse("2026-11-02T16:00:00-03:00"));
  });

  test("48 h se cuentan hasta el inicio de la franja", () => {
    // Viernes 30: 10 h está a 43 h, 16 h a 49 h.
    expect(franjasDisponibles("2026-10-30", 48, ahora)).toEqual(["16-19"]);
    expect(fechaMinima(48, ahora)).toBe("2026-10-30");
    // Con 72 h, el viernes no alcanza; el sábado 9 h (66 h) tampoco: lunes.
    expect(fechaMinima(72, ahora)).toBe("2026-11-02");
  });

  test("hasta 30 días adelante", () => {
    expect(fechaMaxima(ahora)).toBe("2026-11-27");
  });

  test("validarFechaFranja: domingo, franja de otro día, fuera de horario, antes de 48 h y más de 30 días", () => {
    expect(validarFechaFranja("2026-11-01", "10-13", 48, ahora)).toMatchObject({ field: "date", message: expect.stringContaining("domingos") });
    expect(validarFechaFranja("2026-10-31", "16-19", 48, ahora)).toMatchObject({ field: "slot" });
    expect(validarFechaFranja("2026-11-02", "19-22", 48, ahora)).toMatchObject({ field: "slot" });
    expect(validarFechaFranja("2026-10-30", "10-13", 48, ahora)).toMatchObject({ field: "date", message: expect.stringContaining("48 h") });
    expect(validarFechaFranja("2026-12-15", "10-13", 48, ahora)).toMatchObject({ field: "date", message: expect.stringContaining("30 días") });
    expect(validarFechaFranja("2026-10-30", "16-19", 48, ahora)).toBeNull();
    expect(validarFechaFranja("2026-10-31", "9-13", 48, ahora)).toBeNull();
  });

  test("envío solo desde $400.000", () => {
    expect(puedeEnvio(399999)).toBe(false);
    expect(puedeEnvio(400000)).toBe(true);
  });
});

test.describe("external_reference", () => {
  test("pedido e inscripción con prefijo; el formato viejo es una inscripción", () => {
    expect(leerReferencia(referenciaPedido(uuid))).toEqual({ tipo: "pedido", id: uuid });
    expect(leerReferencia(referenciaInscripcion(uuid))).toEqual({ tipo: "inscripcion", id: uuid });
    expect(leerReferencia(uuid)).toEqual({ tipo: "inscripcion", id: uuid });
  });

  test("lo que no es nuestro se ignora", () => {
    expect(leerReferencia(null)).toBeNull();
    expect(leerReferencia("pedido-123")).toBeNull();
    expect(leerReferencia("pedido:123")).toBeNull();
    expect(leerReferencia(`otra:${uuid}`)).toBeNull();
  });
});

test.describe("Preferencia de un pedido", () => {
  const datos = {
    pedido: { id: uuid, numero: 12, email: "prueba@ejemplo.com", venceAt: "2026-10-28T18:30:00.000Z" },
    items: [
      { productoId: otro, nombre: "Budín", tamano: "Grande", sabor: "Limón", cantidad: 2, precioUnitario: 15000 },
      { productoId: null, nombre: "Cookies", tamano: "Caja x6", sabor: null, cantidad: 1, precioUnitario: 9000 },
    ],
  };

  test("un ítem por línea con el precio de la base y la referencia del pedido", () => {
    const pref = armarPreferenciaPedido({ ...datos, baseUrl: "https://homebakery.com.ar" });
    expect(pref.items).toEqual([
      { id: otro, title: "Budín · Grande · Limón", quantity: 2, unit_price: 15000, currency_id: "ARS" },
      { id: "item-2", title: "Cookies · Caja x6", quantity: 1, unit_price: 9000, currency_id: "ARS" },
    ]);
    expect(pref.external_reference).toBe(`pedido:${uuid}`);
    expect(pref.back_urls?.success).toBe(`https://homebakery.com.ar/pedido/resultado?pedido=${uuid}`);
    expect(pref.auto_return).toBe("approved");
    expect(pref.expiration_date_to).toBe(datos.pedido.venceAt);
    expect(pref.payment_methods?.excluded_payment_types).toEqual([{ id: "ticket" }, { id: "atm" }]);
  });

  test("en localhost no manda auto_return", () => {
    expect(armarPreferenciaPedido({ ...datos, baseUrl: "http://localhost:3000" }).auto_return).toBeUndefined();
  });
});

test.describe("Qué ve quien vuelve de pagar un pedido", () => {
  const base = { venceAt: new Date(ahora + 10 * 60_000).toISOString(), pagos: [] };
  const pago = (estado: string, devolucionPendiente = false) => ({ estado, devolucionPendiente, createdAt: new Date(ahora).toISOString() });

  test("pagado (y lo que sigue) es 'pagado, esperando confirmación', nunca confirmado", () => {
    for (const estado of ["pagado", "aceptado", "en_preparacion", "listo", "entregado"]) {
      expect(vistaPedido({ ...base, estado }, ahora)).toEqual({ tipo: "pagado" });
    }
    // Un segundo pago que se devuelve no cambia que el pedido está pagado.
    expect(vistaPedido({ ...base, estado: "pagado", pagos: [pago("approved", true)] }, ahora)).toEqual({ tipo: "pagado" });
  });

  test("pendiente, rechazado, vencido, devolución y cancelado", () => {
    expect(vistaPedido({ ...base, estado: "pendiente_pago" }, ahora)).toEqual({ tipo: "pendiente", puedePagar: true });
    expect(vistaPedido({ ...base, estado: "pendiente_pago", pagos: [pago("in_process")] }, ahora)).toEqual({ tipo: "pendiente", puedePagar: false });
    expect(vistaPedido({ ...base, estado: "pendiente_pago", pagos: [pago("rejected")] }, ahora)).toEqual({ tipo: "rechazada", vigente: true });
    expect(vistaPedido({ ...base, estado: "pendiente_pago" }, ahora + 11 * 60_000)).toEqual({ tipo: "vencida" });
    expect(vistaPedido({ ...base, estado: "rechazado", pagos: [pago("approved", true)] }, ahora)).toEqual({ tipo: "devolucion" });
    expect(vistaPedido({ ...base, estado: "cancelado" }, ahora)).toEqual({ tipo: "cancelada" });
  });
});

test.describe("Esquema del pedido", () => {
  const valido = {
    name: "Ana Prueba",
    email: "ana@ejemplo.com",
    phone: "11 5555-6666",
    delivery: "retiro",
    date: "2026-11-02",
    slot: "10-13",
    items: [{ productId: uuid, sizeId: otro, quantity: 1 }],
  };

  test("acepta un pedido válido y descarta precios que mande el cliente", () => {
    const result = pedidoSchema.safeParse({ ...valido, total: 1, items: [{ ...valido.items[0], unitPrice: 1 }] });
    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty("total");
    expect(result.data?.items[0]).not.toHaveProperty("unitPrice");
  });

  test("envío sin dirección, domingo, franja de otro día y cantidades fuera de rango", () => {
    const errores = (data: object) => {
      const result = pedidoSchema.safeParse({ ...valido, ...data });
      return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
    };
    expect(errores({ delivery: "envio" })).toEqual(expect.arrayContaining(["address", "locality"]));
    expect(errores({ date: "2026-11-01" })).toContain("date");
    expect(errores({ date: "2026-10-31", slot: "10-13" })).toContain("slot");
    expect(errores({ items: [{ ...valido.items[0], quantity: 21 }] })).toContain("items.0.quantity");
    expect(errores({ items: [] })).toContain("items");
  });
});

test.describe("Carrito guardado", () => {
  const linea: Linea = {
    productId: uuid,
    slug: "budin",
    sizeId: otro,
    name: "Budín",
    sizeLabel: "Grande",
    flavor: "Limón",
    decoration: null,
    quantity: 2,
    unitPrice: 15000,
    leadTimeHours: 48,
    image: null,
  };

  test("la misma combinación suma la cantidad, con tope de 20", () => {
    const lines = agregarLinea(agregarLinea([], linea), { ...linea, quantity: 19 });
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(20);
    expect(agregarLinea(lines, { ...linea, flavor: "Naranja" })).toHaveLength(2);
    expect(claveLinea(linea)).not.toBe(claveLinea({ ...linea, decoration: "Flores" }));
  });

  test("lo que no pasa el esquema o es de otra versión se descarta", () => {
    expect(leerCarrito(JSON.stringify({ version: 1, lines: [linea] }))).toEqual([linea]);
    expect(leerCarrito(JSON.stringify({ version: 2, lines: [linea] }))).toEqual([]);
    expect(leerCarrito(JSON.stringify({ version: 1, lines: [{ ...linea, quantity: 0 }] }))).toEqual([]);
    expect(leerCarrito("{roto")).toEqual([]);
    expect(leerCarrito(null)).toEqual([]);
    expect(carritoSchema.safeParse({ version: 1, lines: [{ ...linea, unitPrice: -1 }] }).success).toBe(false);
  });
});
