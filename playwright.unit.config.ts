import { defineConfig, type Project } from "@playwright/test";

// Solo los tests unitarios: importan funciones de lib/ y no abren navegador,
// no levantan el servidor ni tocan la base. Son los que corren en CI
// (npm run test:unit). La suite completa (npm run test:e2e) los incluye con
// este mismo proyecto.

export const unitTests = [/-unit\.spec\.ts$/, /temporada\.spec\.ts$/];

export const unitProject: Project = { name: "unit", testMatch: unitTests };

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  // En CI, las fallas como anotaciones en el PR y el reporte html para el
  // artifact que sube el workflow cuando algo falla.
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  projects: [unitProject],
});
