import type { APIRequestContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  avisarPago,
  cargarPago,
  firmar,
  leerInscripcion,
  nuevoPagoId,
  pagosDe,
  preferenciaDe,
  vencer,
} from "./support/pagos";
import {
  borrarWorkshopsDePrueba,
  crearWorkshopDePrueba,
  expect,
  hasSupabase,
  lugaresOcupados,
  skipReason,
  test,
  type TestWorkshop,
} from "./support/supabase";
import { authFile } from "./support/usuarios";

// Pagos contra Supabase y el mock de Mercado Pago (e2e/support/mp-mock.ts).
// Cada test usa su propio workshop de prueba (cupo 6, $ 30.000, pago
// completo) que se borra al terminar.

test.skip(!hasSupabase, skipReason);

async function inscribir(request: APIRequestContext, workshop: TestWorkshop, spots = 1, email = "prueba@ejemplo.com") {
  const response = await request.post("/api/v1/inscripciones", {
    data: { workshopSlug: workshop.slug, name: "Prueba E2E", whatsapp: "11 5555-6666", email, acceptsPolicy: true, spots },
  });
  return { response, body: await response.json() };
}

/** Inscribe y devuelve el id y el monto que calculó la base. */
async function inscripta(request: APIRequestContext, workshop: TestWorkshop, spots = 1) {
  const { response, body } = await inscribir(request, workshop, spots);
  expect(response.status()).toBe(201);
  const db = await leerInscripcion(body.data.id);
  return { id: body.data.id as string, initPoint: body.data.initPoint as string, monto: Number(db.monto_sena) };
}

test.describe("Inscripción con preferencia de pago", () => {
  test("crea la preferencia con el total que calcula la base", async ({ request, workshop }) => {
    const { response, body } = await inscribir(request, workshop, 2);
    expect(response.status()).toBe(201);
    const { id, initPoint } = body.data;
    expect(initPoint).toMatch(/\/checkout\?pref_id=pref-e2e-/);

    const db = await leerInscripcion(id);
    expect(db).toMatchObject({ estado: "pendiente_sena", mp_init_point: initPoint });
    expect(Number(db.monto_sena)).toBe(60000);
    expect(db.mp_preference_id).toMatch(/^pref-e2e-/);
    // Vence en ~30 minutos.
    const minutos = (new Date(db.vence_at).getTime() - Date.now()) / 60_000;
    expect(minutos).toBeGreaterThan(28);
    expect(minutos).toBeLessThanOrEqual(30);

    const pref = await preferenciaDe(request, `inscripcion:${id}`);
    expect(pref.items).toEqual([
      expect.objectContaining({ title: `Inscripción · ${workshop.name} · 2 lugares`, unit_price: 60000, quantity: 1, currency_id: "ARS" }),
    ]);
    expect(pref.external_reference).toBe(`inscripcion:${id}`);
    expect(pref.payer.email).toBe("prueba@ejemplo.com");
    expect(pref.back_urls.success).toBe(`http://localhost:3100/workshops/${workshop.slug}/inscripcion/resultado?inscripcion=${id}`);
    expect(pref.statement_descriptor).toBe("HOMEBAKERY");
    expect(new Date(pref.expiration_date_to).getTime()).toBe(new Date(db.vence_at).getTime());
    // Nunca notification_url: el webhook es el del panel de MP. En localhost, tampoco auto_return.
    expect(pref.notification_url).toBeUndefined();
    expect(pref.auto_return).toBeUndefined();
  });

  test("con la clave publishable no se puede llamar a crear_inscripcion (solo el servidor)", async ({ workshop }) => {
    const publica = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false },
    });
    const { data, error } = await publica.rpc("crear_inscripcion", {
      p_workshop_slug: workshop.slug,
      p_nombre: "Sin pasar por la API",
      p_whatsapp: "11 5555-6666",
      p_email: "prueba@ejemplo.com",
      p_cantidad: 1,
      p_acepta_politica: true,
    });
    expect(data).toBeNull();
    expect(error?.code).toBe("42501");
    expect(await lugaresOcupados(workshop.id)).toBe(0);
  });

  test("422 si el workshop no tiene precio", async ({ request }) => {
    const workshop = await crearWorkshopDePrueba({ precio: null });
    try {
      const { response, body } = await inscribir(request, workshop);
      expect(response.status()).toBe(422);
      expect(body.error.message).toBe("Precio a confirmar, consultanos por WhatsApp.");
      expect(await lugaresOcupados(workshop.id)).toBe(0);
    } finally {
      await borrarWorkshopsDePrueba([workshop.id]);
    }
  });

  test("502 si Mercado Pago falla, y el cupo se libera al instante", async ({ request, workshop }) => {
    const { response, body } = await inscribir(request, workshop, 3, "falla-mp@example.com");
    expect(response.status()).toBe(502);
    expect(body.error.message).toBe("No pudimos iniciar el pago. Probá de nuevo en un rato.");
    expect(await lugaresOcupados(workshop.id)).toBe(0);
  });
});

test.describe("Webhook de Mercado Pago", () => {
  test("approved → la inscripción queda reservada", async ({ request, workshop }) => {
    const { id, monto } = await inscripta(request, workshop, 2);
    const pagoId = nuevoPagoId();
    // La referencia que manda la web desde la 0007.
    await cargarPago(request, pagoId, { status: "approved", external_reference: `inscripcion:${id}`, transaction_amount: monto });

    const response = await avisarPago(request, pagoId);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ resultado: "registrado", tipo: "inscripcion", estado: "reservada", cambio: true });
    expect((await leerInscripcion(id)).estado).toBe("reservada");
    expect(await pagosDe(id)).toEqual([
      expect.objectContaining({ mp_payment_id: pagoId, estado: "approved", devolucion_pendiente: false }),
    ]);

    const { data } = await (await request.get("/api/v1/workshops")).json();
    expect(data.find((item: { slug: string }) => item.slug === workshop.slug).spotsLeft).toBe(4);
  });

  test("una inscripción con la referencia vieja (el id solo, antes de la 0007) se sigue registrando", async ({ request, workshop }) => {
    const { id, monto } = await inscripta(request, workshop);
    const pagoId = nuevoPagoId();
    await cargarPago(request, pagoId, { status: "approved", external_reference: id, transaction_amount: monto });
    expect(await (await avisarPago(request, pagoId)).json()).toMatchObject({ tipo: "inscripcion", estado: "reservada" });
    expect((await leerInscripcion(id)).estado).toBe("reservada");
  });

  test("rejected → sigue pendiente", async ({ request, workshop }) => {
    const { id, monto } = await inscripta(request, workshop);
    const pagoId = nuevoPagoId();
    await cargarPago(request, pagoId, { status: "rejected", status_detail: "cc_rejected_other_reason", external_reference: id, transaction_amount: monto });

    expect((await avisarPago(request, pagoId)).status()).toBe(200);
    expect((await leerInscripcion(id)).estado).toBe("pendiente_sena");
    expect(await pagosDe(id)).toEqual([expect.objectContaining({ estado: "rejected" })]);
  });

  test("monto distinto del total → no reserva y queda para devolver", async ({ request, workshop }) => {
    const { id, monto } = await inscripta(request, workshop);
    const pagoId = nuevoPagoId();
    await cargarPago(request, pagoId, { status: "approved", external_reference: id, transaction_amount: monto - 1 });

    expect((await avisarPago(request, pagoId)).status()).toBe(200);
    expect((await leerInscripcion(id)).estado).toBe("pendiente_sena");
    expect(await pagosDe(id)).toEqual([
      expect.objectContaining({ devolucion_pendiente: true, motivo_devolucion: "monto_distinto" }),
    ]);
  });

  test("avisos duplicados (y simultáneos) → un solo pago, sin cambios extra", async ({ request, workshop }) => {
    const { id, monto } = await inscripta(request, workshop, 2);
    const pagoId = nuevoPagoId();
    await cargarPago(request, pagoId, { status: "approved", external_reference: id, transaction_amount: monto });

    const responses = await Promise.all([1, 2, 3].map(() => avisarPago(request, pagoId)));
    expect(responses.map((response) => response.status())).toEqual([200, 200, 200]);
    const bodies = await Promise.all(responses.map((response) => response.json()));
    expect(bodies.filter((body) => body.cambio)).toHaveLength(1);

    const otra = await avisarPago(request, pagoId);
    expect(await otra.json()).toMatchObject({ estado: "reservada", cambio: false });
    expect(await pagosDe(id)).toHaveLength(1);
    expect(await lugaresOcupados(workshop.id)).toBe(2);
  });

  test("un evento que no es de pago → 200 sin cambios", async ({ request, workshop }) => {
    const { id } = await inscripta(request, workshop);
    const response = await avisarPago(request, "777", { type: "merchant_order", headers: firmar("777") });
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ ignorado: "no_es_un_pago" });
    expect((await leerInscripcion(id)).estado).toBe("pendiente_sena");
  });

  test("firma inválida, vieja o sin headers → 401 sin cambios", async ({ request, workshop }) => {
    const { id, monto } = await inscripta(request, workshop);
    const pagoId = nuevoPagoId();
    await cargarPago(request, pagoId, { status: "approved", external_reference: id, transaction_amount: monto });

    const casos = [
      firmar(pagoId, { clave: "otro-secret" }),
      firmar(pagoId, { ts: Math.floor(Date.now() / 1000) - 3600 }),
      firmar("otro-id"),
      {},
    ];
    for (const headers of casos) {
      const response = await avisarPago(request, pagoId, { headers });
      expect(response.status()).toBe(401);
      expect((await response.json()).error.message).toBe("Firma inválida.");
    }
    expect((await leerInscripcion(id)).estado).toBe("pendiente_sena");
    expect(await pagosDe(id)).toEqual([]);
  });

  test("pagos que no son nuestros → 200 sin cambios", async ({ request }) => {
    // No existe en MP.
    const inexistente = await avisarPago(request, nuevoPagoId());
    expect(await inexistente.json()).toMatchObject({ resultado: "ignorado", motivo: "pago_inexistente" });
    // De otra referencia (no es una inscripción ni un pedido).
    const ajeno = nuevoPagoId();
    await cargarPago(request, ajeno, { status: "approved", external_reference: "pedido-123", transaction_amount: 10 });
    expect(await (await avisarPago(request, ajeno)).json()).toMatchObject({ resultado: "ignorado", motivo: "sin_external_reference" });
  });
});

test.describe("Vencimiento y cupo", () => {
  test("una pendiente vencida libera el cupo", async ({ request }) => {
    const workshop = await crearWorkshopDePrueba({ cupo: 2 });
    try {
      const primera = await inscripta(request, workshop, 2);
      expect((await inscribir(request, workshop, 1)).response.status()).toBe(409);

      await vencer(primera.id);
      expect(await lugaresOcupados(workshop.id)).toBe(0);
      const { data } = await (await request.get("/api/v1/workshops")).json();
      expect(data.find((item: { slug: string }) => item.slug === workshop.slug).spotsLeft).toBe(2);
      expect((await inscribir(request, workshop, 2)).response.status()).toBe(201);
    } finally {
      await borrarWorkshopsDePrueba([workshop.id]);
    }
  });

  test("aprobada después de vencer: se reserva si todavía hay lugar", async ({ request, workshop }) => {
    const { id, monto } = await inscripta(request, workshop, 2);
    await vencer(id);
    const pagoId = nuevoPagoId();
    await cargarPago(request, pagoId, { status: "approved", external_reference: id, transaction_amount: monto });
    expect(await (await avisarPago(request, pagoId)).json()).toMatchObject({ estado: "reservada" });
  });

  test("dos pagos aprobados por el último lugar: uno reserva y el otro queda para devolver", async ({ request }) => {
    const workshop = await crearWorkshopDePrueba({ cupo: 2 });
    try {
      // Las dos vencieron (cada una pudo inscribirse cuando la otra ya no ocupaba lugar) y pagan a la vez.
      const a = await inscripta(request, workshop, 2);
      await vencer(a.id);
      const b = await inscripta(request, workshop, 2);
      await vencer(b.id);
      const [pagoA, pagoB] = [nuevoPagoId(), nuevoPagoId()];
      await cargarPago(request, pagoA, { status: "approved", external_reference: a.id, transaction_amount: a.monto });
      await cargarPago(request, pagoB, { status: "approved", external_reference: b.id, transaction_amount: b.monto });

      const responses = await Promise.all([avisarPago(request, pagoA), avisarPago(request, pagoB)]);
      expect(responses.map((response) => response.status())).toEqual([200, 200]);

      const estados = [(await leerInscripcion(a.id)).estado, (await leerInscripcion(b.id)).estado].sort();
      expect(estados).toEqual(["cancelada", "reservada"]);
      const perdedora = (await leerInscripcion(a.id)).estado === "cancelada" ? a.id : b.id;
      expect(await pagosDe(perdedora)).toEqual([
        expect.objectContaining({ estado: "approved", devolucion_pendiente: true, motivo_devolucion: "sin_cupo" }),
      ]);
      expect(await lugaresOcupados(workshop.id)).toBe(2);
    } finally {
      await borrarWorkshopsDePrueba([workshop.id]);
    }
  });
});

test.describe("Página de resultado", () => {
  const resultado = (workshop: TestWorkshop, id: string) => `/workshops/${workshop.slug}/inscripcion/resultado?inscripcion=${id}`;

  test("concilia sin webhook: el pago aprobado reserva el lugar", async ({ page, request, workshop }) => {
    const { id, monto } = await inscripta(request, workshop, 2);
    await cargarPago(request, nuevoPagoId(), { status: "approved", external_reference: id, transaction_amount: monto });

    // MP manda status=pending en la URL: se ignora, manda la base.
    await page.goto(`${resultado(workshop, id)}&status=pending&collection_status=pending`);
    const titulo = page.getByRole("heading", { level: 1 });
    await expect(titulo).toHaveText("¡Tu lugar está reservado!");
    await expect(titulo).toBeFocused();
    await expect(page.getByTestId("resultado-total")).toHaveText(/60\.000/);

    const ics = page.getByRole("link", { name: "Agregar al calendario" });
    await expect(ics).toHaveAttribute("download", "workshop-home-bakery.ics");
    expect(decodeURIComponent((await ics.getAttribute("href")) ?? "")).toContain("BEGIN:VCALENDAR");
    expect((await leerInscripcion(id)).estado).toBe("reservada");
  });

  test("pendiente: avisa, se refresca solo y muestra la reserva cuando se aprueba", async ({ page, request, workshop }) => {
    const { id, monto } = await inscripta(request, workshop);
    const pagoId = nuevoPagoId();
    await cargarPago(request, pagoId, { status: "in_process", external_reference: id, transaction_amount: monto });

    await page.goto(resultado(workshop, id));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Estamos esperando la confirmación del pago");
    await expect(page.locator("[aria-live=polite]", { hasText: "Esta página se actualiza sola" })).toBeVisible();

    await cargarPago(request, pagoId, { status: "approved", external_reference: id, transaction_amount: monto });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("¡Tu lugar está reservado!", { timeout: 15_000 });
  });

  test("rechazado: ofrece reintentar mientras la reserva está vigente", async ({ page, request, workshop }) => {
    const { id, initPoint, monto } = await inscripta(request, workshop);
    await cargarPago(request, nuevoPagoId(), { status: "rejected", external_reference: id, transaction_amount: monto });

    await page.goto(resultado(workshop, id));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("El pago no se aprobó");
    await expect(page.getByRole("link", { name: "Probar de nuevo" })).toHaveAttribute("href", initPoint);

    await vencer(id);
    await page.reload();
    await expect(page.getByText("La reserva del lugar ya venció.", { exact: false })).toBeVisible();
    await expect(page.getByRole("link", { name: "Volver a inscribirme" })).toHaveAttribute(
      "href",
      `/workshops/${workshop.slug}/inscripcion`,
    );
  });

  test("vencida sin pago: volver a inscribirse", async ({ page, request, workshop }) => {
    const { id } = await inscripta(request, workshop);
    await vencer(id);
    await page.goto(resultado(workshop, id));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("La reserva venció");
  });

  test("404 si la inscripción no existe o es de otro workshop", async ({ page, request, workshop }) => {
    const { id } = await inscripta(request, workshop);
    expect((await page.goto(`/workshops/otro-workshop/inscripcion/resultado?inscripcion=${id}`))?.status()).toBe(404);
    expect((await page.goto(resultado(workshop, "no-es-un-id")))?.status()).toBe(404);
    expect((await page.goto(resultado(workshop, "00000000-0000-4000-8000-000000000000")))?.status()).toBe(404);
  });
});

test.describe("Panel", () => {
  test.use({ storageState: authFile.admin });

  test("la admin ve la inscripción con su pago y los pagos para devolver", async ({ page, request, workshop }) => {
    const { id, monto } = await inscripta(request, workshop);
    const pagoId = nuevoPagoId();
    await cargarPago(request, pagoId, { status: "approved", external_reference: id, transaction_amount: monto + 5 });
    await avisarPago(request, pagoId);

    await page.goto("/admin/inscripciones");
    const fila = page.getByTestId(`inscripcion-${id}`);
    await expect(fila).toContainText(workshop.name);
    await expect(fila.getByRole("combobox")).toHaveValue("pendiente_sena");
    await expect(fila).toContainText(pagoId);
    await expect(page.getByRole("heading", { name: "Para devolver" })).toBeVisible();
    await expect(page.getByTestId(`devolucion-${pagoId}`)).toContainText("Monto distinto del total");
  });
});
