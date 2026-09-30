import { expect, test } from "@playwright/test";

// 6 lugares libres en data/workshops.ts.
const url = "/workshops/tortas-de-capas/inscripcion";

test.describe("Inscripción a un workshop", () => {
  test("muestra los errores por campo y lleva el foco al primero", async ({ page }) => {
    await page.goto(url);
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

  test("envía la inscripción y pasa al paso de pago", async ({ page }) => {
    await page.goto(url);

    await page.getByRole("textbox", { name: "Nombre y apellido" }).fill("Ana Pérez");
    await page.getByRole("textbox", { name: "WhatsApp" }).fill("11 5555-6666");
    await page.getByRole("textbox", { name: "Email" }).fill("ana@ejemplo.com");
    await page.getByRole("radio", { name: "Algo en casa" }).check();
    await page.getByRole("textbox", { name: "Alergias o restricciones alimentarias" }).fill("Frutos secos");
    await page.getByRole("combobox", { name: "¿Cómo conociste Home Bakery?" }).selectOption("Instagram");

    const summary = page.getByRole("complementary", { name: "Resumen del workshop" });
    await summary.getByRole("button", { name: "Un lugar más" }).click();
    await expect(summary.getByText("2 lugares")).toBeAttached();
    await expect(summary.getByRole("button", { name: "Un lugar menos" })).toBeEnabled();

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar al pago" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Revisá y pagá" })).toBeFocused();
    await expect(page.getByRole("listitem").filter({ hasText: "2 · Pago" })).toHaveAttribute("aria-current", "step");
    await expect(summary.getByText("Quedan 4")).toBeVisible();

    const whatsapp = page.getByRole("link", { name: "Enviar por WhatsApp" });
    const href = await whatsapp.getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\//);
    const message = new URL(href!).searchParams.get("text");
    expect(message).toContain("Ana Pérez");
    expect(message).toContain("2 lugares");

    await expect(page.getByRole("button", { name: /Mercado Pago/ })).toBeDisabled();
  });
});
