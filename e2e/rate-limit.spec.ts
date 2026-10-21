import { expect, hasSupabase, skipReason, test } from "./support/supabase";
import { testUser } from "./support/usuarios";

// Corre último (proyecto "rate-limit" en playwright.config.ts): deja
// bloqueados los logins desde esta IP por 15 minutos.

test.skip(!hasSupabase, skipReason);
// El último intento usa la contraseña real: sin trace.
test.use({ trace: "off" });

test("después de 5 intentos fallidos bloquea el login, aunque la contraseña sea correcta", async ({ page }) => {
  const intentar = async (email: string, password: string) => {
    await page.goto("/admin/ingresar");
    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByLabel("Contraseña").fill(password);
    await page.getByRole("button", { name: "Ingresar" }).click();
    return page.locator("form").getByRole("alert");
  };

  // Otros tests ya fallaron algún login desde esta IP: a lo sumo 5 intentos más.
  let bloqueado = false;
  for (let intento = 0; intento < 6 && !bloqueado; intento++) {
    const alert = await intentar("no-existe@example.com", "incorrecta");
    await expect(alert).toBeVisible();
    bloqueado = (await alert.textContent())?.startsWith("Demasiados intentos") ?? false;
  }
  expect(bloqueado).toBe(true);

  const { email, password } = testUser("admin");
  const alert = await intentar(email, password);
  await expect(alert).toHaveText(/^Demasiados intentos\. Probá de nuevo en \d+ minutos?\.$/);
  await expect(page).toHaveURL(/\/admin\/ingresar/);
});
