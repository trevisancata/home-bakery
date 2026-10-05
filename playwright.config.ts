import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Los tests leen y escriben Supabase: las claves salen de .env.local (Next
// las carga solo para el servidor; acá hacen falta también para los tests).
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// Cada corrida levanta un build de producción nuevo.
const port = 3100;

export default defineConfig({
  testDir: "e2e",
  // Red de seguridad: borra los workshops de prueba que hayan quedado.
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
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
