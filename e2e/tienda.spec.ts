import { expect, hasSupabase, skipReason, test } from "./support/supabase";

test.skip(!hasSupabase, skipReason);

const catalogo = (page: import("@playwright/test").Page) =>
  page.getByRole("list", { name: /Todos los productos|Budines|Postres/ });

test.describe("Tienda", () => {
  test("filtra por categoría y lo refleja en la URL", async ({ page }) => {
    await page.goto("/tienda");
    await expect(page.getByRole("heading", { level: 2, name: "Todos los productos" })).toBeVisible();

    const filtros = page.getByRole("group", { name: "Filtrar por categoría" });
    await filtros.getByRole("button", { name: "Budines" }).click();

    await expect(page).toHaveURL(/\/tienda\?categoria=budines$/);
    await expect(filtros.getByRole("button", { name: "Budines" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { level: 2, name: "Budines" })).toBeVisible();
    const items = catalogo(page).getByRole("listitem");
    await expect(items.first()).toBeVisible();
    // La categoría de cada tarjeta (el eyebrow) es Budines.
    const categorias = await catalogo(page).locator("article > p:first-of-type").allTextContents();
    expect(new Set(categorias)).toEqual(new Set(["Budines"]));
    await expect(catalogo(page).getByRole("link", { name: "Budín de chocolate" })).toBeVisible();

    await filtros.getByRole("button", { name: "Todo" }).click();
    await expect(page).toHaveURL(/\/tienda$/);
  });

  test("entra directo a una categoría desde la URL", async ({ page }) => {
    await page.goto("/tienda?categoria=postres");
    await expect(page.getByRole("heading", { level: 2, name: "Postres" })).toBeVisible();
    await expect(catalogo(page).getByRole("link", { name: "Volcanes de chocolate" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Budín de chocolate" })).toHaveCount(0);
  });

  test("muestra un estado vacío si la categoría no existe", async ({ page }) => {
    await page.goto("/tienda?categoria=inexistente");
    await expect(page.getByText("No hay productos en esta categoría.")).toBeVisible();
    await page.getByRole("button", { name: "Ver todo" }).click();
    await expect(page).toHaveURL(/\/tienda$/);
  });

  test("abre el detalle de un producto desde la tarjeta", async ({ page }) => {
    await page.goto("/tienda?categoria=budines");
    await page.getByRole("link", { name: "Budín de chocolate" }).click();
    await expect(page).toHaveURL(/\/tienda\/budin-de-chocolate$/);
    await expect(page.getByRole("heading", { level: 1, name: "Budín de chocolate" })).toBeVisible();
    await expect(page).toHaveTitle(/Budín de chocolate/);
  });

  test("detalle con precio a confirmar y temporada", async ({ page }) => {
    await page.goto("/tienda/tarta-de-frutillas");
    await expect(page.getByRole("heading", { level: 1, name: "Tarta de frutillas" })).toBeVisible();
    await expect(page.getByText("Precio a confirmar")).toBeVisible();
    await expect(page.getByText("Solo en temporada: de septiembre a febrero")).toBeVisible();
    await expect(page.getByText("24 cm de diámetro")).toBeVisible();
  });

  test("un producto a medida se consulta por WhatsApp", async ({ page }) => {
    await page.goto("/tienda/number-cake");
    const whatsapp = page.getByRole("link", { name: "Consultar por WhatsApp" });
    const href = await whatsapp.getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\//);
    expect(new URL(href!).searchParams.get("text")).toContain("Number cake");
    await expect(page.getByRole("heading", { level: 2, name: "Sabores" })).toBeVisible();
  });

  test("un producto oculto da 404", async ({ page }) => {
    const response = await page.goto("/tienda/red-velvet");
    expect(response?.status()).toBe(404);
  });
});
