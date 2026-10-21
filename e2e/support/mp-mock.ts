// Mock de la API de Mercado Pago para los e2e (lo levanta playwright.config.ts
// como segundo webServer). El servidor de Next apunta el SDK acá con
// MP_API_BASE_URL (lib/mercadopago.ts), así los tests no usan credenciales
// reales ni crean preferencias de verdad.
//
// Imita lo que usa la web:
//   POST /checkout/preferences/      → { id, init_point } (guarda el body)
//   GET  /v1/payments/:id            → el pago cargado por el test, o 404
//   GET  /v1/payments/search?external_reference= → { results }
//   GET  /checkout                   → página "Checkout de prueba" (el init_point)
// Y para los tests:
//   PUT    /__mock/payments/:id      → carga o reemplaza un pago
//   GET    /__mock/preferences?external_reference= → la preferencia creada
//   GET    /__mock/health

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const port = Number(process.env.MP_MOCK_PORT ?? 3101);
const token = process.env.MP_MOCK_TOKEN ?? "TEST-e2e";

type Json = Record<string, unknown>;
const preferences = new Map<string, Json>();
const payments = new Map<string, Json>();
let next = 1;

function send(res: ServerResponse, status: number, body: unknown, type = "application/json") {
  res.writeHead(status, { "Content-Type": type });
  res.end(type === "application/json" ? JSON.stringify(body) : String(body));
}

async function readBody(req: IncomingMessage): Promise<Json> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? (JSON.parse(text) as Json) : {};
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  try {
    // Control de los tests.
    if (path === "/__mock/health") return send(res, 200, { ok: true });
    const mockPayment = /^\/__mock\/payments\/([^/]+)$/.exec(path);
    if (mockPayment && req.method === "PUT") {
      payments.set(mockPayment[1], { ...(await readBody(req)), id: Number(mockPayment[1]) });
      return send(res, 200, { ok: true });
    }
    if (path === "/__mock/preferences" && req.method === "GET") {
      const ref = url.searchParams.get("external_reference");
      const found = [...preferences.values()].find((pref) => pref.external_reference === ref);
      return found ? send(res, 200, found) : send(res, 404, { message: "not found" });
    }
    if (path === "/checkout") {
      return send(res, 200, "<!doctype html><title>Checkout de prueba</title><h1>Checkout de prueba</h1>", "text/html");
    }

    // API de MP: como la real, pide el access token.
    if (req.headers.authorization !== `Bearer ${token}`) {
      return send(res, 401, { message: "invalid access token", status: 401 });
    }
    if (path === "/checkout/preferences" && req.method === "POST") {
      const body = await readBody(req);
      if (url.searchParams.get("fail") || (body.payer as Json | undefined)?.email === "falla-mp@example.com") {
        return send(res, 500, { message: "internal_error", status: 500 });
      }
      const id = `pref-e2e-${next++}`;
      const init_point = `http://127.0.0.1:${port}/checkout?pref_id=${id}`;
      const preference = { ...body, id, init_point, sandbox_init_point: init_point };
      preferences.set(id, preference);
      return send(res, 201, preference);
    }
    if (path === "/v1/payments/search" && req.method === "GET") {
      const ref = url.searchParams.get("external_reference");
      const results = [...payments.values()].filter((payment) => payment.external_reference === ref);
      return send(res, 200, { paging: { total: results.length, limit: 30, offset: 0 }, results });
    }
    const payment = /^\/v1\/payments\/([^/]+)$/.exec(path);
    if (payment && req.method === "GET") {
      const found = payments.get(payment[1]);
      return found ? send(res, 200, found) : send(res, 404, { message: "Payment not found", status: 404 });
    }
    return send(res, 404, { message: "not found" });
  } catch {
    return send(res, 400, { message: "bad request" });
  }
});

server.listen(port, "127.0.0.1", () => console.log(`Mock de Mercado Pago en http://127.0.0.1:${port}`));
