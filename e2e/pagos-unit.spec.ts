import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import { eventoIcs } from "../lib/ics";
import { estadoPago } from "../lib/pagos/estados";
import { toleranciaSegundos, validarFirma, webhookSecret } from "../lib/pagos/firma";
import { armarPreferencia, statementDescriptor } from "../lib/pagos/preferencia";
import { vistaResultado } from "../lib/pagos/vista";
import { createRateLimiter } from "../lib/rate-limit";
import { montoSena } from "../lib/sena";
import { siteUrl } from "../lib/site-url";

// Unitarios: no levantan navegador ni tocan la base ni Mercado Pago.

const secret = "secreto-de-prueba";
const ahora = Date.parse("2026-10-21T15:00:00Z");
const ts = Math.floor(ahora / 1000);

/** Firma como lo hace Mercado Pago: HMAC-SHA256 de "id:…;request-id:…;ts:…;". */
function firma(dataId: string, requestId: string, timestamp: number | string = ts, clave = secret) {
  const v1 = createHmac("sha256", clave).update(`id:${dataId};request-id:${requestId};ts:${timestamp};`).digest("hex");
  return `ts=${timestamp},v1=${v1}`;
}

const valida = { xSignature: firma("123456", "req-1"), xRequestId: "req-1", dataId: "123456", secret, now: () => ahora };

test.describe("Firma del webhook (x-signature)", () => {
  test("acepta una firma válida", () => {
    expect(validarFirma(valida)).toEqual({ ok: true });
  });

  test("rechaza un v1 que no coincide", () => {
    expect(validarFirma({ ...valida, xSignature: `ts=${ts},v1=${"0".repeat(64)}` })).toMatchObject({ ok: false });
  });

  test("rechaza si se firmó con otro secret", () => {
    expect(validarFirma({ ...valida, xSignature: firma("123456", "req-1", ts, "otro-secret") })).toMatchObject({ ok: false });
  });

  test("rechaza si el data.id no es el firmado", () => {
    expect(validarFirma({ ...valida, dataId: "999" })).toMatchObject({ ok: false });
  });

  test("rechaza si el x-request-id no es el firmado", () => {
    expect(validarFirma({ ...valida, xRequestId: "otro" })).toMatchObject({ ok: false });
  });

  test("rechaza un ts vencido o adelantado", () => {
    const viejo = ts - toleranciaSegundos - 1;
    expect(validarFirma({ ...valida, xSignature: firma("123456", "req-1", viejo) })).toEqual({
      ok: false,
      motivo: "ts_fuera_de_tolerancia",
    });
    const futuro = ts + toleranciaSegundos + 1;
    expect(validarFirma({ ...valida, xSignature: firma("123456", "req-1", futuro) })).toMatchObject({ ok: false });
    // Dentro de la tolerancia, sí.
    expect(validarFirma({ ...valida, xSignature: firma("123456", "req-1", ts - 60) })).toEqual({ ok: true });
  });

  test("acepta ts en milisegundos (la documentación de MP usa los dos)", () => {
    expect(validarFirma({ ...valida, xSignature: firma("123456", "req-1", ahora) })).toEqual({ ok: true });
  });

  test("rechaza si faltan headers, el data.id o el secret", () => {
    expect(validarFirma({ ...valida, xSignature: null })).toEqual({ ok: false, motivo: "sin_x_signature" });
    expect(validarFirma({ ...valida, xRequestId: null })).toEqual({ ok: false, motivo: "sin_x_request_id" });
    expect(validarFirma({ ...valida, dataId: null })).toEqual({ ok: false, motivo: "sin_data_id" });
    expect(validarFirma({ ...valida, secret: "" })).toEqual({ ok: false, motivo: "sin_secret" });
  });

  test("la clave del webhook se usa sin espacios ni saltos de línea alrededor", () => {
    expect(webhookSecret({ MP_WEBHOOK_SECRET: `  ${secret}\n` })).toBe(secret);
    expect(webhookSecret({})).toBe("");
    // Una clave pegada con un salto de línea igual valida la firma.
    expect(validarFirma({ ...valida, secret: webhookSecret({ MP_WEBHOOK_SECRET: `${secret}\r\n` }) })).toEqual({ ok: true });
  });

  test("rechaza un header mal armado", () => {
    expect(validarFirma({ ...valida, xSignature: "cualquier-cosa" })).toMatchObject({ ok: false });
    expect(validarFirma({ ...valida, xSignature: `ts=abc,v1=${"0".repeat(64)}` })).toMatchObject({ ok: false });
  });
});

test.describe("Cálculo del monto", () => {
  test("precio × lugares × porcentaje / 100", () => {
    expect(montoSena(30000, 1, 50)).toBe(15000);
    expect(montoSena(30000, 3, 50)).toBe(45000);
    expect(montoSena(10000, 3, 30)).toBe(9000);
    // Pago completo (migración 0006): el total.
    expect(montoSena(25000, 8, 100)).toBe(200000);
    expect(montoSena(30000, 2, 100)).toBe(60000);
  });

  test("redondea al centavo igual que la base (round half up)", () => {
    expect(montoSena(33333.33, 1, 50)).toBe(16666.67);
    expect(montoSena(0.01, 1, 50)).toBe(0.01);
    expect(montoSena(19999.99, 3, 33)).toBe(19799.99);
  });

  test("sin errores de punto flotante", () => {
    expect(montoSena(0.1 + 0.2, 1, 100)).toBe(0.3);
  });
});

test.describe("Preferencia de Checkout Pro", () => {
  const datos = {
    inscripcion: {
      id: "6f1d2a43-0000-4000-8000-000000000001",
      email: "ana@ejemplo.com",
      cantidad: 2,
      montoSena: 60000,
      venceAt: "2026-10-21T15:30:00.000Z",
    },
    workshop: { slug: "tortas-de-capas", nombre: "Tortas de capas" },
  };

  test("con la URL pública (https): back_urls y auto_return, sin notification_url", () => {
    const pref = armarPreferencia({ ...datos, baseUrl: "https://homebakery.com.ar" });
    const resultado = "https://homebakery.com.ar/workshops/tortas-de-capas/inscripcion/resultado?inscripcion=6f1d2a43-0000-4000-8000-000000000001";
    expect(pref.items).toEqual([
      { id: "tortas-de-capas", title: "Inscripción · Tortas de capas · 2 lugares", quantity: 1, unit_price: 60000, currency_id: "ARS" },
    ]);
    // Con prefijo desde la 0007: el mismo webhook atiende inscripciones y pedidos.
    expect(pref.external_reference).toBe(`inscripcion:${datos.inscripcion.id}`);
    expect(pref.payer).toEqual({ email: "ana@ejemplo.com" });
    expect(pref.back_urls).toEqual({ success: resultado, pending: resultado, failure: resultado });
    expect(pref.auto_return).toBe("approved");
    // El webhook se configura en el panel de MP (firma con la clave del panel), no en la preferencia.
    expect(pref.notification_url).toBeUndefined();
    expect(pref.expires).toBe(true);
    expect(pref.expiration_date_to).toBe(datos.inscripcion.venceAt);
    expect(pref.statement_descriptor).toBe(statementDescriptor);
    expect(pref.payment_methods?.excluded_payment_types).toEqual([{ id: "ticket" }, { id: "atm" }]);
  });

  test("en localhost no manda auto_return (MP no lo acepta)", () => {
    const pref = armarPreferencia({ ...datos, baseUrl: "http://localhost:3000" });
    expect(pref.auto_return).toBeUndefined();
    expect(pref.notification_url).toBeUndefined();
    expect(pref.back_urls?.success).toContain("http://localhost:3000/workshops/tortas-de-capas/inscripcion/resultado");
  });

  test("un lugar en singular", () => {
    const pref = armarPreferencia({ ...datos, inscripcion: { ...datos.inscripcion, cantidad: 1 }, baseUrl: "https://x.com" });
    expect(pref.items[0].title).toBe("Inscripción · Tortas de capas · 1 lugar");
  });
});

test.describe("Estados de Mercado Pago", () => {
  test("se traducen a los de la tabla pagos", () => {
    expect(estadoPago("approved")).toBe("approved");
    expect(estadoPago("authorized")).toBe("pending");
    expect(estadoPago("in_mediation")).toBe("in_process");
    expect(estadoPago("charged_back")).toBe("refunded");
    expect(estadoPago("cualquiera")).toBeNull();
    expect(estadoPago(null)).toBeNull();
  });
});

test.describe("URL del sitio", () => {
  test("NEXT_PUBLIC_SITE_URL, si no VERCEL_URL, si no localhost", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://homebakery.com.ar/", VERCEL_URL: "x.vercel.app" })).toBe("https://homebakery.com.ar");
    expect(siteUrl({ VERCEL_URL: "home-bakery-git-x.vercel.app" })).toBe("https://home-bakery-git-x.vercel.app");
    expect(siteUrl({})).toBe("http://localhost:3000");
  });
});

test.describe("Evento de calendario (.ics)", () => {
  test("arma el VEVENT con inicio, fin y textos escapados", () => {
    const ics = eventoIcs({
      uid: "abc",
      titulo: "Workshop: Tortas, capas; y más",
      inicio: "2026-11-14T13:00:00.000Z",
      duracionMinutos: 150,
      lugar: "Cocina de Maggie · San Isidro",
      ahora: new Date("2026-10-21T15:00:00Z"),
    });
    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("UID:abc@homebakery\r\n");
    expect(ics).toContain("DTSTART:20261114T130000Z\r\n");
    expect(ics).toContain("DTEND:20261114T153000Z\r\n");
    expect(ics).toContain("SUMMARY:Workshop: Tortas\\, capas\\; y más\r\n");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});

test.describe("Rate limiter", () => {
  test("bloquea después del máximo y se libera al terminar la ventana", () => {
    const limiter = createRateLimiter({ max: 5, windowMs: 10 * 60_000 });
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(limiter.blockedMinutes("ip", t0)).toBeNull();
      limiter.hit("ip", t0);
    }
    expect(limiter.blockedMinutes("ip", t0)).toBe(10);
    expect(limiter.blockedMinutes("otra-ip", t0)).toBeNull();
    expect(limiter.blockedMinutes("ip", t0 + 10 * 60_000)).toBeNull();
    limiter.clear("ip");
    expect(limiter.blockedMinutes("ip", t0)).toBeNull();
  });
});

test.describe("Qué ve quien vuelve de Mercado Pago", () => {
  const base = { venceAt: new Date(ahora + 10 * 60_000).toISOString(), pagos: [] };
  const pago = (estado: string, minuto = 0, devolucionPendiente = false) => ({
    estado,
    devolucionPendiente,
    createdAt: new Date(ahora + minuto * 60_000).toISOString(),
  });

  test("según el estado de la inscripción y su último pago", () => {
    expect(vistaResultado({ ...base, estado: "reservada" }, ahora)).toEqual({ tipo: "reservada" });
    expect(vistaResultado({ ...base, estado: "pendiente_sena" }, ahora)).toEqual({ tipo: "pendiente", puedePagar: true });
    expect(vistaResultado({ ...base, estado: "pendiente_sena", pagos: [pago("in_process")] }, ahora)).toEqual({
      tipo: "pendiente",
      puedePagar: false,
    });
    expect(vistaResultado({ ...base, estado: "pendiente_sena", pagos: [pago("rejected")] }, ahora)).toEqual({
      tipo: "rechazada",
      vigente: true,
    });
    // Manda el último pago: rechazado y después en proceso → pendiente.
    expect(
      vistaResultado({ ...base, estado: "pendiente_sena", pagos: [pago("rejected", 0), pago("pending", 1)] }, ahora).tipo,
    ).toBe("pendiente");
    expect(vistaResultado({ ...base, estado: "pendiente_sena" }, ahora + 11 * 60_000)).toEqual({ tipo: "vencida" });
    expect(vistaResultado({ ...base, estado: "pendiente_sena", pagos: [pago("rejected")] }, ahora + 11 * 60_000)).toEqual({
      tipo: "rechazada",
      vigente: false,
    });
    expect(vistaResultado({ ...base, estado: "cancelada", pagos: [pago("approved", 0, true)] }, ahora)).toEqual({ tipo: "devolucion" });
    expect(vistaResultado({ ...base, estado: "cancelada" }, ahora)).toEqual({ tipo: "cancelada" });
  });
});
