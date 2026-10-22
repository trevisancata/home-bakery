import { expect, test as setup } from "@playwright/test";
import { hasSupabase, skipReason } from "./support/supabase";
import { authFile, testUser } from "./support/usuarios";

// Ingresa por la pantalla de login con cada usuaria de prueba y guarda la
// sesión (cookies) para los tests del panel.

setup.skip(!hasSupabase, skipReason);
// El trace guarda lo que se escribe en los inputs: acá van contraseñas reales.
setup.use({ trace: "off" });

setup("sesión de la admin", async ({ page }) => {
  const { email, password } = testUser("admin");
  await page.goto("/admin/ingresar");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL("/admin");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Resumen");
  await page.context().storageState({ path: authFile.admin });
});

setup("sesión sin rol", async ({ page }) => {
  const { email, password } = testUser("sinRol");
  await page.goto("/admin/ingresar");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL("/admin");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("No tenés permiso");
  await page.context().storageState({ path: authFile.sinRol });
});
