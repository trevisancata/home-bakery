import { abrirHastaVer, borrarWorkshopPorApi, crearWorkshopPorApi, expect, hasSupabase, skipReason, test } from "./support/supabase";
import { authFile } from "./support/usuarios";

test.skip(!hasSupabase, skipReason);

// Cada test usa un workshop de prueba propio (cupo 6) que se borra al final.
const urlOf = (slug: string) => `/workshops/${slug}/inscripcion`;

test.describe("Inscripción a un workshop", () => {
  test("muestra los errores por campo y lleva el foco al primero", async ({ page, workshop }) => {
    await page.goto(urlOf(workshop.slug));
    await page.getByRole("button", { name: "Continuar al pago" }).click();

    const name = page.getByRole("textbox", { name: "Nombre y apellido" });
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAccessibleDescription("Ingresá tu nombre y apellido.");
    await expect(page.getByText("Ingresá tu WhatsApp.")).toBeVisible();
    await expect(page.getByText("Tenés que aceptar la política de cancelación.")).toBeVisible();

    await name.fill("Ana Pérez");
    await expect(name).not.toHaveAttribute("aria-invalid");

    await page.getByRole("textbox", { name: "WhatsApp" }).fill("11 5555-6666");
    await page.getByRole("textbox", { name: "Email" }).fill("ana-sin-arroba");
    await page.getByRole("button", { name: "Continuar al pago" }).click();

    const email = page.getByRole("textbox", { name: "Email" });
    await expect(email).toBeFocused();
    await expect(email).toHaveAccessibleDescription(
      "Revisá el email: tiene que ser del estilo nombre@ejemplo.com.",
    );
  });

  test("envía la inscripción y pasa al paso del pago", async ({ page, workshop }) => {
    await page.goto(urlOf(workshop.slug));

    await page.getByRole("textbox", { name: "Nombre y apellido" }).fill("Ana Pérez");
    await page.getByRole("textbox", { name: "WhatsApp" }).fill("11 5555-6666");
    await page.getByRole("textbox", { name: "Email" }).fill("ana@ejemplo.com");
    await page.getByRole("radio", { name: "Algo en casa" }).check();
    await page.getByRole("textbox", { name: "Alergias o restricciones alimentarias" }).fill("Frutos secos");
    await page.getByRole("combobox", { name: "¿Cómo conociste Home Bakery?" }).selectOption("Instagram");

    const summary = page.getByRole("complementary", { name: "Resumen del workshop" });
    await expect(summary.getByText("Total a pagar")).toBeVisible();
    await expect(summary.getByTestId("inscripcion-total")).toHaveText(/30\.000/);
    await summary.getByRole("button", { name: "Un lugar más" }).click();
    await expect(summary.getByText("2 lugares")).toBeAttached();
    await expect(summary.getByRole("button", { name: "Un lugar menos" })).toBeEnabled();

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar al pago" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Revisá y pagá" })).toBeFocused();
    await expect(page.getByRole("listitem").filter({ hasText: "2 · Pago" })).toHaveAttribute("aria-current", "step");
    await expect(summary.getByText("Quedan 4")).toBeVisible();

    // Total: 2 × $ 30.000, la misma cuenta que hace la base.
    await expect(page.getByTestId("pago-total")).toHaveText(/60\.000/);
    await expect(page.getByText("Tu lugar queda reservado con el pago.")).toBeVisible();
    await expect(page.getByText("Guardamos tu lugar 30 minutos mientras pagás.", { exact: false })).toBeVisible();

    // WhatsApp queda solo como ayuda.
    const ayuda = page.getByRole("link", { name: "Escribinos por WhatsApp (se abre WhatsApp)" });
    expect(await ayuda.getAttribute("href")).toMatch(/^https:\/\/wa\.me\//);

    // "Pagar con Mercado Pago" lleva al checkout (acá, el del mock de MP), sin pagar.
    const pagar = page.getByRole("link", { name: "Pagar con Mercado Pago" });
    await expect(pagar).toHaveAttribute("href", /\/checkout\?pref_id=pref-e2e-/);
    await pagar.click();
    await expect(page.getByRole("heading", { name: "Checkout de prueba" })).toBeVisible();
    expect(new URL(page.url()).searchParams.get("pref_id")).toMatch(/^pref-e2e-/);
  });

  test("los workshops de ejemplo muestran el aviso y no se pueden reservar", async ({ page, playwright, baseURL }) => {
    // Workshop de ejemplo propio, creado con la API de admin: /workshops es
    // estática (ISR) y la API la revalida. La página navega sin sesión.
    const api = await playwright.request.newContext({ baseURL, storageState: authFile.admin });
    const ejemplo = await crearWorkshopPorApi(api, { isExample: true });
    try {
      const fila = page.getByRole("listitem").filter({ hasText: ejemplo.name });
      await abrirHastaVer(page, "/workshops", () => fila);
      await expect(fila.getByText("Fecha de ejemplo: todavía no hay inscripción abierta")).toBeVisible();
      await expect(fila.getByRole("link", { name: /Reservar/ })).toHaveCount(0);

      await page.goto(`/workshops/${ejemplo.slug}/inscripcion`);
      await expect(page.getByText("Fecha de ejemplo: todavía no hay inscripción abierta")).toBeVisible();
      await expect(page.getByRole("button", { name: "Continuar al pago" })).toHaveCount(0);
    } finally {
      await borrarWorkshopPorApi(api, ejemplo.id);
      await api.dispose();
    }
  });
});
