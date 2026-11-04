import { expect, test } from "@playwright/test";
import { carritoSchema, leerCarrito } from "../lib/carrito/esquema";
import { agregarLinea, claveLinea, type Linea } from "../lib/carrito/lineas";
import { armarPreferenciaPedido } from "../lib/pagos/preferencia";
import { leerReferencia, referenciaInscripcion, referenciaPedido } from "../lib/pagos/referencia";
import { vistaPedido } from "../lib/pagos/vista";
import { formatShortDateTime } from "../lib/format";
import { etiquetaVisible, mostrarTamano, tamanoUnico } from "../lib/tamano";
import { agruparPorDia, avisoWhatsApp, estadoDelPago, historial, type PedidoPanel, pestanaDe, porPestana } from "../lib/admin/pedidos-panel";
import {
  diaDeSemana,
  fechaBA,
  fechaMaxima,
  fechaMinima,
  franjasDelDia,
  franjasDisponibles,
  inicioFranja,
  puedeEnvio,
  sumarDias,
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

  test("plazo de la transferencia: dd/mm hh:mm en hora de Buenos Aires, con ceros", () => {
    expect(formatShortDateTime("2026-11-05T20:26:00Z")).toBe("05/11 17:26 h");
    expect(formatShortDateTime("2026-01-01T02:05:00Z")).toBe("31/12 23:05 h");
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
  const base = {
    medioPago: "mercadopago" as const,
    venceAt: new Date(ahora + 10 * 60_000).toISOString(),
    pagadoAt: null,
    devolucionPendiente: false,
    pagos: [],
  };
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

  test("transferencia: datos hasta que vence a las 24 h; registrada, pagado; rechazada con pago, devolución", () => {
    const venceAt = new Date(ahora + 24 * 3_600_000).toISOString();
    const transferencia = { ...base, medioPago: "transferencia" as const, venceAt, estado: "pendiente_pago" };
    expect(vistaPedido(transferencia, ahora)).toEqual({ tipo: "transferencia", venceAt });
    expect(vistaPedido(transferencia, ahora + 24 * 3_600_000 + 1)).toEqual({ tipo: "vencida" });
    // Registrada por la admin (aunque haya sido después del plazo).
    expect(vistaPedido({ ...transferencia, estado: "pagado", pagadoAt: venceAt }, ahora + 25 * 3_600_000)).toEqual({ tipo: "pagado" });
    expect(vistaPedido({ ...transferencia, estado: "rechazado", pagadoAt: venceAt, devolucionPendiente: true }, ahora)).toEqual({
      tipo: "devolucion",
    });
  });

  test("efectivo: a pagar al retirar (aunque esté aceptado) hasta que se cobra; no vence", () => {
    const efectivo = { ...base, medioPago: "efectivo" as const, venceAt: null, estado: "pendiente_pago" };
    expect(vistaPedido(efectivo, ahora + 365 * 24 * 3_600_000)).toEqual({ tipo: "efectivo" });
    expect(vistaPedido({ ...efectivo, estado: "aceptado" }, ahora)).toEqual({ tipo: "efectivo" });
    expect(vistaPedido({ ...efectivo, estado: "entregado", pagadoAt: new Date(ahora).toISOString() }, ahora)).toEqual({ tipo: "pagado" });
    expect(vistaPedido({ ...efectivo, estado: "rechazado" }, ahora)).toEqual({ tipo: "cancelada" });
  });
});

/** El próximo lunes con al menos dos días de margen: el esquema rechaza fechas pasadas. */
function proximoLunes() {
  let fecha = sumarDias(fechaBA(Date.now()), 2);
  while (diaDeSemana(fecha) !== 1) fecha = sumarDias(fecha, 1);
  return fecha;
}

test.describe("Esquema del pedido", () => {
  const valido = {
    name: "Ana Prueba",
    email: "ana@ejemplo.com",
    phone: "11 5555-6666",
    delivery: "retiro",
    payment: "mercadopago",
    date: proximoLunes(),
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

  test("medio de pago: los tres con retiro; efectivo con envío, no; sin medio, error", () => {
    for (const payment of ["mercadopago", "transferencia", "efectivo"]) {
      expect(pedidoSchema.safeParse({ ...valido, payment }).success).toBe(true);
    }
    const errores = (data: object) => {
      const result = pedidoSchema.safeParse({ ...valido, ...data });
      return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
    };
    const envio = { delivery: "envio", address: "Calle 123", locality: "San Isidro" };
    expect(errores({ ...envio, payment: "efectivo" })).toEqual(["payment"]);
    expect(errores({ ...envio, payment: "transferencia" })).toEqual([]);
    expect(errores({ payment: undefined })).toEqual(["payment"]);
    expect(errores({ payment: "cripto" })).toEqual(["payment"]);
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

test.describe("Panel de pedidos", () => {
  const base: PedidoPanel = {
    id: uuid,
    numero: 7,
    nombre: "Ana Prueba",
    email: "ana@ejemplo.com",
    telefono: "11 5555-6666",
    entrega: "retiro",
    direccion: null,
    localidad: null,
    fecha: "2026-10-30",
    franja: "10-13",
    notas: null,
    total: 24000,
    estado: "pendiente_pago",
    medioPago: "mercadopago",
    venceAt: new Date(ahora + 10 * 60_000).toISOString(),
    createdAt: new Date(ahora - 60_000).toISOString(),
    pagadoAt: null,
    pagadoPor: null,
    aceptadoAt: null,
    enPreparacionAt: null,
    listoAt: null,
    entregadoAt: null,
    rechazadoAt: null,
    canceladoAt: null,
    motivoRechazo: null,
    motivoCancelacion: null,
    devolucionPendiente: false,
    devueltoAt: null,
    unidades: 2,
    pagos: [],
  };
  const pedido = (extra: Partial<PedidoPanel>): PedidoPanel => ({ ...base, ...extra });

  test("cada pedido en su pestaña; un MP pagándose no aparece; vencido, a rechazados", () => {
    expect(pestanaDe(pedido({ estado: "pagado" }), ahora)).toBe("por_confirmar");
    expect(pestanaDe(pedido({ medioPago: "efectivo", venceAt: null }), ahora)).toBe("por_confirmar");
    expect(pestanaDe(pedido({ medioPago: "transferencia" }), ahora)).toBe("esperando_transferencia");
    expect(pestanaDe(pedido({ medioPago: "transferencia" }), ahora + 60 * 60_000)).toBe("esperando_transferencia");
    for (const estado of ["aceptado", "en_preparacion", "listo"]) expect(pestanaDe(pedido({ estado }), ahora)).toBe("en_curso");
    expect(pestanaDe(pedido({ estado: "entregado" }), ahora)).toBe("entregados");
    expect(pestanaDe(pedido({ estado: "rechazado" }), ahora)).toBe("rechazados");
    expect(pestanaDe(pedido({ estado: "cancelado" }), ahora)).toBe("rechazados");
    expect(pestanaDe(pedido({}), ahora)).toBeNull();
    expect(pestanaDe(pedido({}), ahora + 11 * 60_000)).toBe("rechazados");
  });

  test("ordenados por día y franja; en curso, agrupados en Hoy, Mañana y la fecha", () => {
    const lista = [
      pedido({ id: "c", numero: 3, estado: "aceptado", fecha: "2026-11-02", franja: "10-13" }),
      pedido({ id: "b", numero: 2, estado: "listo", fecha: "2026-10-29", franja: "16-19" }),
      pedido({ id: "a", numero: 1, estado: "aceptado", fecha: "2026-10-29", franja: "10-13" }),
      pedido({ id: "d", numero: 4, estado: "en_preparacion", fecha: "2026-10-28", franja: "16-19" }),
    ];
    const { en_curso } = porPestana(lista, ahora);
    expect(en_curso.map((p) => p.numero)).toEqual([4, 1, 2, 3]);
    expect(agruparPorDia(en_curso, ahora).map((d) => [d.etiqueta, d.pedidos.length])).toEqual([
      ["Hoy", 1],
      ["Mañana", 2],
      ["Lunes, 2 de noviembre", 1],
    ]);
  });

  test("estado del pago según el medio", () => {
    const pagoMp = { id: otro, mpPaymentId: "1", estado: "approved", monto: 24000, devolucionPendiente: false, motivoDevolucion: null, devueltoAt: null, createdAt: base.createdAt };
    expect(estadoDelPago(pedido({ estado: "pagado", pagos: [pagoMp] }), ahora)).toBe("Mercado Pago · pagado");
    const venceAt = "2026-10-29T20:26:00.000Z";
    expect(estadoDelPago(pedido({ medioPago: "transferencia", venceAt }), ahora)).toBe("Transferencia · esperando, vence 29/10 17:26 h");
    expect(estadoDelPago(pedido({ medioPago: "transferencia", venceAt }), Date.parse(venceAt) + 1)).toBe("Transferencia · vencida, sin registrar");
    expect(estadoDelPago(pedido({ medioPago: "efectivo", venceAt: null, estado: "aceptado" }), ahora)).toBe("Efectivo · a cobrar al retirar");
    expect(estadoDelPago(pedido({ medioPago: "efectivo", venceAt: null, pagadoAt: base.createdAt }), ahora)).toBe("Efectivo · cobrado");
    expect(estadoDelPago(pedido({ medioPago: "transferencia", estado: "rechazado", pagadoAt: base.createdAt, devolucionPendiente: true }), ahora)).toBe(
      "Transferencia · para devolver",
    );
  });

  test("historial en orden, con quién registró el pago", () => {
    const t = (min: number) => new Date(ahora + min * 60_000).toISOString();
    const eventos = historial(
      pedido({ medioPago: "transferencia", pagadoAt: t(1), pagadoPor: "yo", aceptadoAt: t(2), enPreparacionAt: t(3) }),
      "yo",
    ).map((e) => e.texto);
    expect(eventos).toEqual(["Pedido hecho", "Pago registrado por vos", "Aceptado", "En preparación"]);
    expect(historial(pedido({ pagadoAt: t(1), pagadoPor: "otra" }), "yo")[1].texto).toBe("Pago registrado por otra cuenta del panel");
  });

  test("aviso de WhatsApp: aceptado, listo (retiro o envío), rechazado y cancelado con motivo", () => {
    const texto = (p: PedidoPanel) => {
      const href = avisoWhatsApp(p);
      return href ? new URL(href).searchParams.get("text") : null;
    };
    expect(avisoWhatsApp(pedido({ estado: "aceptado" }))).toMatch(/^https:\/\/wa\.me\/5491155556666\?text=/);
    expect(texto(pedido({ estado: "aceptado" }))).toContain("pedido #7 para el viernes, 30 de octubre, 10 a 13 h");
    expect(texto(pedido({ estado: "listo" }))).toContain("listo para retirar");
    expect(texto(pedido({ estado: "listo", entrega: "envio" }))).toContain("te lo llevo");
    expect(texto(pedido({ estado: "rechazado", motivoRechazo: "no llego con la fecha" }))).toContain("no llego con la fecha");
    expect(texto(pedido({ estado: "cancelado", motivoCancelacion: "se me complicó" }))).toContain("se me complicó");
    expect(avisoWhatsApp(pedido({ estado: "pagado" }))).toBeNull();
  });
});

test.describe("Tamaño único", () => {
  test("se muestra solo si el producto tiene más de un tamaño", () => {
    expect(mostrarTamano("Grande", 2)).toBe(true);
    expect(mostrarTamano("Único", 1)).toBe(false);
    // Manda la cantidad, no el texto: un tamaño único con otro nombre tampoco se muestra.
    expect(mostrarTamano("Porción", 1)).toBe(false);
    expect(mostrarTamano("Único", 2)).toBe(true);
  });

  test("sin la cantidad (pedidos ya hechos, carritos viejos), decide la etiqueta", () => {
    for (const etiqueta of ["Único", "único", " UNICO ", "Unico"]) expect(mostrarTamano(etiqueta)).toBe(false);
    expect(mostrarTamano("Grande")).toBe(true);
    expect(mostrarTamano("Grande", null)).toBe(true);
    expect(mostrarTamano("")).toBe(false);
    expect(mostrarTamano(null)).toBe(false);
    expect([etiquetaVisible("Único"), "Limón"].filter(Boolean).join(" · ")).toBe("Limón");
    expect(etiquetaVisible(" Grande ", 2)).toBe("Grande");
  });

  test("selector oculto solo con un tamaño y con precio", () => {
    expect(tamanoUnico([{ price: 9000 }])).toBe(true);
    expect(tamanoUnico([{ price: null }])).toBe(false);
    expect(tamanoUnico([{ price: 9000 }, { price: null }])).toBe(false);
    expect(tamanoUnico([{ price: 9000 }, { price: 12000 }])).toBe(false);
  });
});
