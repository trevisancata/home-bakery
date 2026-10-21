import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Los tests leen y escriben Supabase: las claves salen de .env.local (Next
// las carga solo para el servidor; acá hacen falta también para los tests).
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// Cada corrida levanta un build de producción nuevo.
const port = 3100;
// Mock de la API de Mercado Pago (e2e/support/mp-mock.ts).
const mpMockPort = 3101;

// Secret del webhook de MP solo para esta corrida: lo usan el servidor (para
// validar) y los tests (para firmar). Se genera una vez en el proceso
// principal; los workers lo heredan por el entorno.
process.env.E2E_MP_WEBHOOK_SECRET ??= randomBytes(32).toString("hex");
process.env.E2E_MP_MOCK_URL ??= `http://127.0.0.1:${mpMockPort}`;

export default defineConfig({
  testDir: "e2e",
  // Crea las usuarias de prueba del panel (admin y sin rol).
  globalSetup: "./e2e/support/global-setup.ts",
  // Borra todo lo de prueba: usuarias, productos, fotos y workshops "e2e-…".
  globalTeardown: "./e2e/support/teardown.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    locale: "es-AR",
    // Con el scroll suave del sitio, Playwright a veces se traba al hacer
    // scroll hasta un elemento; con movimiento reducido el sitio lo desactiva.
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [
    // Ingresa con cada usuaria de prueba y guarda la sesión (e2e/.auth/).
    { name: "setup", testMatch: /auth\.setup\.ts/, use: { ...devices["Desktop Chrome"] } },
    {
      name: "chromium",
      testIgnore: /rate-limit\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },
    // Último: bloquea los logins desde esta IP durante 15 minutos.
    {
      name: "rate-limit",
      testMatch: /rate-limit\.spec\.ts/,
      dependencies: ["chromium"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON e2e/support/mp-mock.ts",
      url: `http://127.0.0.1:${mpMockPort}/__mock/health`,
      env: { MP_MOCK_PORT: String(mpMockPort), MP_MOCK_TOKEN: "TEST-e2e" },
      reuseExistingServer: false,
    },
    {
      command: `npm run build && npm run start -- --port ${port}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: false,
      timeout: 240_000,
      // Mercado Pago apunta al mock: los e2e nunca usan las credenciales
      // reales de .env.local (las variables del proceso le ganan a .env.local).
      env: {
        MP_API_BASE_URL: process.env.E2E_MP_MOCK_URL,
        MP_ACCESS_TOKEN: "TEST-e2e",
        MP_WEBHOOK_SECRET: process.env.E2E_MP_WEBHOOK_SECRET,
        NEXT_PUBLIC_SITE_URL: `http://localhost:${port}`,
        // Los tests inscriben muchas veces desde la misma IP.
        INSCRIPCIONES_RATE_LIMIT_MAX: "1000",
      },
    },
  ],
});
