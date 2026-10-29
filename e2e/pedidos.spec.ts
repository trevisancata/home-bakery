import { createClient } from "@supabase/supabase-js";
import { avisarPago, cargarPago, nuevoPagoId, preferenciaDe } from "./support/pagos";
import {
  domingo,
  emailDePedido,
  itemsDe,
  leerPedido,
  pagosDePedido,
  pedir,
  tamanosDe,
  turnoValido,
  vencerPedido,
} from "./support/pedidos";
import { borrarProductoDePrueba, crearProductoDePrueba, type TestProducto } from "./support/productos";
import { admin, expect, hasSupabase, skipReason, test } from "./support/supabase";
import { testUser } from "./support/usuarios";
import { diaDeSemana, fechaBA, franjasDelDia, sumarDias } from "../lib/pedidos/reglas";

// Pedidos de la tienda contra Supabase y el mock de Mercado Pago. Cada test
// usa productos de prueba propios ("e2e-…", con precios propios), nunca el
// catálogo real. Los pedidos (email "e2e-pedido-…") los borra el teardown.

test.skip(!hasSupabase, skipReason);

type Producto = TestProducto & { chico: string; grande: string };

/** Budín de prueba: Chico $12.000 y Grande $450.000, con dos sabores y una decoración. */
async function budin(extra: Parameters<typeof crearProductoDePrueba>[0] = {}): Promise<Producto> {
  const producto = await crearProductoDePrueba({
    sizes: [
      { label: "Chico", price: 12000 },
      { label: "Grande", price: 450000 },
    ],
    flavors: ["Limón", "Naranja"],
    decorations: ["Flores"],
    ...extra,
  });
  const [chico, grande] = await tamanosDe(producto.id);
  return { ...producto, chico: chico.id, grande: grande.id };
}

const conProducto = test.extend<{ producto: Producto }>({
  producto: async ({}, provide) => {
    const producto = await budin();
    await provide(producto);
    await borrarProductoDePrueba(producto.id);
  },
});

/** Un día de lunes a sábado (si cae domingo, el siguiente). */
const habil = (fecha: string) => (diaDeSemana(fecha) === 0 ? sumarDias(fecha, 1) : fecha);

/** Un día y horario válidos para el calendario pero a menos de 48 h: hoy o mañana, la última franja. */
function antesDe48h() {
  const hoy = fechaBA(Date.now());
  const date = diaDeSemana(sumarDias(hoy, 1)) === 0 ? hoy : sumarDias(hoy, 1);
  return { date, slot: franjasDelDia(date).at(-1)! };
}

/** Cliente con la clave publishable, como cualquier visitante. */
const publica = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });

/** Cliente con la sesión de una usuaria de prueba (para aceptar_pedido / rechazar_pedido). */
async function sesion(kind: "admin" | "sinRol") {
  const client = publica();
  const { error } = await client.auth.signInWithPassword(testUser(kind));
  if (error) throw new Error(`No se pudo ingresar con la usuaria de prueba (${error.code})`);
  return client;
}

/** Un pedido pagado por el webhook (approved por el total). */
async function pagado(request: Parameters<typeof pedir>[0], producto: Producto) {
  const { body } = await pedir(request, [{ productId: producto.id, sizeId: producto.chico, flavor: "Limón", quantity: 1 }]);
  const id = body.data.id as string;
  const pagoId = nuevoPagoId();
  await cargarPago(request, pagoId, { status: "approved", external_reference: `pedido:${id}`, transaction_amount: 12000 });
  expect(await (await avisarPago(request, pagoId)).json()).toMatchObject({ estado: "pagado" });
  return { id, pagoId };
}

conProducto.describe("Crear un pedido", () => {
  conProducto("retiro: guarda el pedido con los precios de la base y crea la preferencia", async ({ request, producto }) => {
    const { response, body } = await pedir(request, [
      { productId: producto.id, sizeId: producto.chico, flavor: "Limón", decoration: "Flores", quantity: 2 },
    ]);
    expect(response.status()).toBe(201);
    expect(body.data).toEqual({ id: expect.any(String), numero: expect.any(Number), initPoint: expect.stringContaining("/checkout") });

    const pedido = await leerPedido(body.data.id);
    expect(pedido).toMatchObject({ estado: "pendiente_pago", entrega: "retiro", direccion: null, numero: body.data.numero });
    expect(Number(pedido.total)).toBe(24000);
    const minutos = (new Date(pedido.vence_at).getTime() - Date.now()) / 60_000;
    expect(minutos).toBeGreaterThan(28);
    expect(minutos).toBeLessThanOrEqual(30);
    expect(await itemsDe(body.data.id)).toEqual([
      expect.objectContaining({ nombre: producto.name, tamano_etiqueta: "Chico", sabor: "Limón", decoracion: "Flores", cantidad: 2 }),
    ]);

    const pref = await preferenciaDe(request, `pedido:${body.data.id}`);
    expect(pref.items).toEqual([expect.objectContaining({ title: `${producto.name} · Chico · Limón`, quantity: 2, unit_price: 12000 })]);
    expect(pref.back_urls.success).toBe(`http://localhost:3100/pedido/resultado?pedido=${body.data.id}`);
    expect(pedido.mp_init_point).toBe(body.data.initPoint);
  });

  conProducto("un precio manipulado en el cliente se ignora: se cobra el de la base", async ({ request, producto }) => {
    const { response, body } = await pedir(request, [
      { productId: producto.id, sizeId: producto.chico, flavor: "Naranja", quantity: 3, unitPrice: 1 } as never,
    ], { total: 3 });
    expect(response.status()).toBe(201);
    expect(Number((await leerPedido(body.data.id)).total)).toBe(36000);
    const pref = await preferenciaDe(request, `pedido:${body.data.id}`);
    expect(pref.items[0].unit_price).toBe(12000);
  });

  conProducto("envío: con total desde $400.000 y dirección completa", async ({ request, producto }) => {
    const { response, body } = await pedir(request, [{ productId: producto.id, sizeId: producto.grande, flavor: "Limón", quantity: 1 }], {
      delivery: "envio",
      address: "Calle de Prueba 123",
      locality: "San Isidro",
    });
    expect(response.status()).toBe(201);
    expect(await leerPedido(body.data.id)).toMatchObject({ entrega: "envio", direccion: "Calle de Prueba 123" });
  });

  conProducto("envío con total bajo → 400 en entrega", async ({ request, producto }) => {
    const { response, body } = await pedir(request, [{ productId: producto.id, sizeId: producto.chico, flavor: "Limón", quantity: 1 }], {
      delivery: "envio",
      address: "Calle de Prueba 123",
      locality: "San Isidro",
    });
    expect(response.status()).toBe(400);
    expect(body.error.fields.delivery).toContain("$400.000");
  });

  conProducto("envío sin dirección → 400", async ({ request, producto }) => {
    const { response, body } = await pedir(request, [{ productId: producto.id, sizeId: producto.grande, flavor: "Limón", quantity: 1 }], {
      delivery: "envio",
    });
    expect(response.status()).toBe(400);
    expect(body.error.fields).toMatchObject({ address: expect.any(String), locality: expect.any(String) });
  });

  conProducto("domingo, fuera de horario, antes de 48 h y más de 30 días → 400 en el campo", async ({ request, producto }) => {
    const items = [{ productId: producto.id, sizeId: producto.chico, flavor: "Limón", quantity: 1 }];
    const casos: [Record<string, string>, "date" | "slot", string][] = [
      [{ date: domingo(), slot: "10-13" }, "date", "domingos"],
      [{ ...turnoValido(), slot: "19-22" }, "slot", "horario"],
      [antesDe48h(), "date", "48 h"],
      [{ date: habil(sumarDias(fechaBA(Date.now()), 40)), slot: "9-13" }, "date", "30 días"],
    ];
    for (const [datos, campo, texto] of casos) {
      const { response, body } = await pedir(request, items, datos);
      expect(response.status(), JSON.stringify(datos)).toBe(400);
      expect(body.error.fields[campo], JSON.stringify(datos)).toContain(texto);
    }
  });

  conProducto("sabor inválido, sin sabor, decoración inválida o tamaño ajeno → 400 en items", async ({ request, producto }) => {
    const otro = await budin();
    try {
      for (const item of [
        { productId: producto.id, sizeId: producto.chico, flavor: "Chocolate", quantity: 1 },
        { productId: producto.id, sizeId: producto.chico, quantity: 1 },
        { productId: producto.id, sizeId: producto.chico, flavor: "Limón", decoration: "Glitter", quantity: 1 },
        { productId: producto.id, sizeId: otro.chico, flavor: "Limón", quantity: 1 },
      ]) {
        const { response, body } = await pedir(request, [item]);
        expect(response.status(), JSON.stringify(item)).toBe(400);
        expect(body.error.fields.items).toBeTruthy();
      }
    } finally {
      await borrarProductoDePrueba(otro.id);
    }
  });

  test("inactivo, a medida, fuera de temporada o con precio a confirmar → 400 en items", async ({ request }) => {
    const mes = Number(new Intl.DateTimeFormat("es-AR", { month: "numeric", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date()));
    const fuera = ((mes + 2) % 12) + 1;
    const productos = await Promise.all([
      budin({ active: false }),
      budin({ custom: true }),
      budin({ season: { from: fuera, to: fuera } }),
      crearProductoDePrueba({ sizes: [{ label: "Único", price: null }] }).then(async (p) => ({ ...p, chico: (await tamanosDe(p.id))[0].id, grande: "" })),
    ]);
    try {
      for (const [i, producto] of productos.entries()) {
        const flavor = i < 3 ? "Limón" : undefined;
        const { response, body } = await pedir(request, [{ productId: producto.id, sizeId: producto.chico, flavor, quantity: 1 }]);
        expect(response.status(), producto.name).toBe(400);
        expect(body.error.fields.items, producto.name).toBeTruthy();
      }
    } finally {
      await Promise.all(productos.map((producto) => borrarProductoDePrueba(producto.id)));
    }
  });

  conProducto("desde otro sitio (Origin) → 403", async ({ request, producto }) => {
    const { response } = await pedir(request, [{ productId: producto.id, sizeId: producto.chico, flavor: "Limón", quantity: 1 }], {}, { Origin: "https://otro-sitio.example" });
    expect(response.status()).toBe(403);
  });

  conProducto("502 si Mercado Pago falla, y el pedido queda cancelado", async ({ request, producto }) => {
    const { response, body } = await pedir(request, [{ productId: producto.id, sizeId: producto.chico, flavor: "Limón", quantity: 1 }], {
      email: "falla-mp@example.com",
    });
    expect(response.status()).toBe(502);
    expect(body.error.message).toBe("No pudimos iniciar el pago. Probá de nuevo en un rato.");
    // No tiene email de prueba: se borra acá.
    const { data } = await admin().from("pedidos").select("id, estado").eq("email", "falla-mp@example.com");
    expect(data?.every((pedido) => pedido.estado === "cancelado")).toBe(true);
    await admin().from("pedidos").delete().eq("email", "falla-mp@example.com");
  });

  conProducto("con la clave publishable no se puede crear un pedido ni leer pedidos", async ({ producto }) => {
    const client = publica();
    const crear = await client.rpc("crear_pedido", {
      p_nombre: "Sin pasar por la API",
      p_email: emailDePedido(),
      p_telefono: "11 5555-6666",
      p_entrega: "retiro",
      p_direccion: null,
      p_localidad: null,
      p_fecha: turnoValido().date,
      p_franja: turnoValido().slot,
      p_notas: null,
      p_items: [{ producto_id: producto.id, tamano_id: producto.chico, sabor: "Limón", cantidad: 1 }],
    });
    expect(crear.error?.code).toBe("42501");
    for (const tabla of ["pedidos", "pedido_items"]) {
      const { data } = await client.from(tabla).select("id").limit(1);
      expect(data ?? []).toEqual([]);
    }
  });
});

conProducto.describe("Pago de un pedido (webhook)", () => {
  conProducto("approved → pagado (esperando que Maggie lo acepte), nunca aceptado", async ({ request, producto }) => {
    const { body } = await pedir(request, [{ productId: producto.id, sizeId: producto.chico, flavor: "Limón", quantity: 2 }]);
    const id = body.data.id as string;
    const pagoId = nuevoPagoId();
    await cargarPago(request, pagoId, { status: "approved", external_reference: `pedido:${id}`, transaction_amount: 24000 });

    const response = await avisarPago(request, pagoId);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ resultado: "registrado", tipo: "pedido", estado: "pagado", cambio: true });
    expect((await leerPedido(id)).estado).toBe("pagado");
    expect(await pagosDePedido(id)).toEqual([expect.objectContaining({ mp_payment_id: pagoId, estado: "approved", devolucion_pendiente: false })]);
  });

  conProducto("avisos duplicados (y simultáneos) → un solo pago, un solo cambio", async ({ request, producto }) => {
    const { body } = await pedir(request, [{ productId: producto.id, sizeId: producto.chico, flavor: "Limón", quantity: 1 }]);
    const id = body.data.id as string;
    const pagoId = nuevoPagoId();
    await cargarPago(request, pagoId, { status: "approved", external_reference: `pedido:${id}`, transaction_amount: 12000 });

    const responses = await Promise.all([1, 2, 3].map(() => avisarPago(request, pagoId)));
    expect(responses.map((response) => response.status())).toEqual([200, 200, 200]);
    const bodies = await Promise.all(responses.map((response) => response.json()));
    expect(bodies.filter((item) => item.cambio)).toHaveLength(1);
    expect(await pagosDePedido(id)).toHaveLength(1);
    expect((await leerPedido(id)).estado).toBe("pagado");
  });

  conProducto("monto distinto → sigue pendiente y el pago queda para devolver", async ({ request, producto }) => {
    const { body } = await pedir(request, [{ productId: producto.id, sizeId: producto.chico, flavor: "Limón", quantity: 1 }]);
    const id = body.data.id as string;
    const pagoId = nuevoPagoId();
    await cargarPago(request, pagoId, { status: "approved", external_reference: `pedido:${id}`, transaction_amount: 1 });
    await avisarPago(request, pagoId);
    expect((await leerPedido(id)).estado).toBe("pendiente_pago");
    expect(await pagosDePedido(id)).toEqual([expect.objectContaining({ devolucion_pendiente: true, motivo_devolucion: "monto_distinto" })]);
  });

  conProducto("un segundo pago aprobado del mismo pedido queda para devolver", async ({ request, producto }) => {
    const { id } = await pagado(request, producto);
    const segundo = nuevoPagoId();
    await cargarPago(request, segundo, { status: "approved", external_reference: `pedido:${id}`, transaction_amount: 12000 });
    await avisarPago(request, segundo);
    const pagos = await pagosDePedido(id);
    expect(pagos.find((pago) => pago.mp_payment_id === segundo)).toMatchObject({ devolucion_pendiente: true, motivo_devolucion: "pago_duplicado" });
    expect((await leerPedido(id)).estado).toBe("pagado");
  });

  conProducto("aprobado después de vencer: igual queda pagado", async ({ request, producto }) => {
    const { body } = await pedir(request, [{ productId: producto.id, sizeId: producto.chico, flavor: "Limón", quantity: 1 }]);
    const id = body.data.id as string;
    await vencerPedido(id);
    const pagoId = nuevoPagoId();
    await cargarPago(request, pagoId, { status: "approved", external_reference: `pedido:${id}`, transaction_amount: 12000 });
    expect(await (await avisarPago(request, pagoId)).json()).toMatchObject({ estado: "pagado" });
  });

  conProducto("rejected → sigue pendiente de pago", async ({ request, producto }) => {
    const { body } = await pedir(request, [{ productId: producto.id, sizeId: producto.chico, flavor: "Limón", quantity: 1 }]);
    const id = body.data.id as string;
    const pagoId = nuevoPagoId();
    await cargarPago(request, pagoId, { status: "rejected", external_reference: `pedido:${id}`, transaction_amount: 12000 });
    expect(await (await avisarPago(request, pagoId)).json()).toMatchObject({ estado: "pendiente_pago", cambio: false });
  });
});

conProducto.describe("Aceptar y rechazar (base)", () => {
  conProducto("la admin acepta un pedido pagado; uno sin pagar no se puede aceptar", async ({ request, producto }) => {
    const client = await sesion("admin");
    const { body } = await pedir(request, [{ productId: producto.id, sizeId: producto.chico, flavor: "Limón", quantity: 1 }]);
    expect((await client.rpc("aceptar_pedido", { p_id: body.data.id })).error?.code).toBe("HB409");

    const { id } = await pagado(request, producto);
    expect((await client.rpc("aceptar_pedido", { p_id: id })).error).toBeNull();
    expect((await leerPedido(id)).estado).toBe("aceptado");
    // Ya aceptado, no se puede rechazar.
    expect((await client.rpc("rechazar_pedido", { p_id: id, p_motivo: "Prueba" })).error?.code).toBe("HB409");
  });

  conProducto("rechazar un pedido pagado deja el pago para devolver", async ({ request, producto }) => {
    const client = await sesion("admin");
    const { id, pagoId } = await pagado(request, producto);
    expect((await client.rpc("rechazar_pedido", { p_id: id, p_motivo: "No llego con la fecha" })).error).toBeNull();
    expect((await leerPedido(id)).estado).toBe("rechazado");
    expect(await pagosDePedido(id)).toEqual([
      expect.objectContaining({ mp_payment_id: pagoId, devolucion_pendiente: true, motivo_devolucion: "pedido_rechazado" }),
    ]);
    // La admin lo marca como devuelto con el mismo circuito de las inscripciones.
    const [pago] = await pagosDePedido(id);
    expect((await client.rpc("marcar_devuelto", { p_pago_id: pago.id })).error).toBeNull();
    // Un aviso repetido de MP no lo vuelve a marcar.
    await avisarPago(request, pagoId);
    expect((await pagosDePedido(id))[0]).toMatchObject({ devolucion_pendiente: false });
  });

  conProducto("un pago que llega con el pedido ya rechazado queda para devolver", async ({ request, producto }) => {
    const client = await sesion("admin");
    const { body } = await pedir(request, [{ productId: producto.id, sizeId: producto.chico, flavor: "Limón", quantity: 1 }]);
    const id = body.data.id as string;
    expect((await client.rpc("rechazar_pedido", { p_id: id })).error).toBeNull();
    const pagoId = nuevoPagoId();
    await cargarPago(request, pagoId, { status: "approved", external_reference: `pedido:${id}`, transaction_amount: 12000 });
    await avisarPago(request, pagoId);
    expect(await pagosDePedido(id)).toEqual([expect.objectContaining({ devolucion_pendiente: true, motivo_devolucion: "pedido_rechazado" })]);
  });

  conProducto("sin rol de admin (o sin sesión) no se puede aceptar ni rechazar", async ({ request, producto }) => {
    const { id } = await pagado(request, producto);
    for (const client of [await sesion("sinRol"), publica()]) {
      expect((await client.rpc("aceptar_pedido", { p_id: id })).error?.code).toBe("42501");
      expect((await client.rpc("rechazar_pedido", { p_id: id })).error?.code).toBe("42501");
    }
    expect((await leerPedido(id)).estado).toBe("pagado");
  });
});
