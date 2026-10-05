import { expect, hasSupabase, skipReason, test } from "./support/supabase";

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

  test("envía la inscripción y pasa al paso de la seña", async ({ page, workshop }) => {
    await page.goto(urlOf(workshop.slug));

    await page.getByRole("textbox", { name: "Nombre y apellido" }).fill("Ana Pérez");
    await page.getByRole("textbox", { name: "WhatsApp" }).fill("11 5555-6666");
    await page.getByRole("textbox", { name: "Email" }).fill("ana@ejemplo.com");
    await page.getByRole("radio", { name: "Algo en casa" }).check();
    await page.getByRole("textbox", { name: "Alergias o restricciones alimentarias" }).fill("Frutos secos");
    await page.getByRole("combobox", { name: "¿Cómo conociste Home Bakery?" }).selectOption("Instagram");

    const summary = page.getByRole("complementary", { name: "Resumen del workshop" });
    await expect(summary.getByText("Total")).toBeVisible();
    await expect(summary.getByText("Seña para reservar (50%)")).toBeVisible();
    await expect(summary.getByText("Saldo")).toBeVisible();
    await summary.getByRole("button", { name: "Un lugar más" }).click();
    await expect(summary.getByText("2 lugares")).toBeAttached();
    await expect(summary.getByRole("button", { name: "Un lugar menos" })).toBeEnabled();

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar al pago" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Revisá y dejá la seña" })).toBeFocused();
    await expect(page.getByRole("listitem").filter({ hasText: "2 · Seña" })).toHaveAttribute("aria-current", "step");
    await expect(summary.getByText("Quedan 4")).toBeVisible();

    // Hasta el E6, "Pagar la seña" abre WhatsApp con el mensaje prefijado.
    const whatsapp = page.getByRole("link", { name: "Pagar la seña (se abre WhatsApp)" });
    const href = await whatsapp.getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\//);
    const message = new URL(href!).searchParams.get("text");
    expect(message).toContain("Ana Pérez");
    expect(message).toContain("2 lugares");
    expect(message).toContain("seña del 50%");
    await expect(page.getByText("El saldo: a confirmar con Maggie.")).toBeVisible();
  });

  test("los workshops de ejemplo muestran el aviso y no se pueden reservar", async ({ page }) => {
    await page.goto("/workshops");
    const fila = page.getByRole("listitem").filter({ hasText: "Budines para empezar" });
    await expect(fila.getByText("Fecha de ejemplo: todavía no hay inscripción abierta")).toBeVisible();
    await expect(fila.getByRole("link", { name: /Reservar/ })).toHaveCount(0);

    await page.goto("/workshops/budines-para-empezar/inscripcion");
    await expect(page.getByText("Fecha de ejemplo: todavía no hay inscripción abierta")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar al pago" })).toHaveCount(0);
  });
});
