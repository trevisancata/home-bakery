import { expect, test } from "@playwright/test";

// Ancho de un teléfono: el menú de escritorio se oculta y aparece el botón "Menú".
test.use({ viewport: { width: 390, height: 844 } });

test.describe("Menú mobile", () => {
  test("se abre, navega a la tienda y se cierra solo", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Menú" });
    const menu = page.getByRole("navigation", { name: "Principal" });

    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(menu.getByRole("link")).toHaveText(["Inicio", "Tienda", "Workshops", "Maggie"]);
    await expect(menu.getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");

    await menu.getByRole("link", { name: "Tienda" }).click();
    await expect(page).toHaveURL("/tienda");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeHidden();

    await toggle.click();
    await expect(menu.getByRole("link", { name: "Tienda" })).toHaveAttribute("aria-current", "page");
  });

  test("Escape lo cierra y devuelve el foco al botón", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Menú" });
    const menu = page.getByRole("navigation", { name: "Principal" });

    await toggle.click();
    await menu.getByRole("link", { name: "Workshops" }).focus();
    await page.keyboard.press("Escape");

    await expect(menu).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  });

  test("un clic afuera lo cierra", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Menú" });
    const menu = page.getByRole("navigation", { name: "Principal" });

    await toggle.click();
    await expect(menu).toBeVisible();

    // Abajo, sobre el margen de la página: lejos del menú y de cualquier link.
    await page.mouse.click(2, 800);
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL("/");
  });
});
