import { expect, hasSupabase, skipReason, test } from "./support/supabase";
import { testUser } from "./support/usuarios";

test.skip(!hasSupabase, skipReason);
// El trace guardaría la contraseña real que se escribe en el login.
test.use({ trace: "off" });

// Sesión propia (sin storageState): cerrar la compartida rompería los otros tests.
test("cerrar sesión vuelve al login y /admin vuelve a pedirlo", async ({ page }) => {
  const { email, password } = testUser("admin");
  await page.goto("/admin/ingresar");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL("/admin");

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.waitForURL("/admin/ingresar");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/ingresar\?next=/);
});
