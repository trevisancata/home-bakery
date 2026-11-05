import { expect, test, type Locator } from "@playwright/test";

// Fondo del header: --color-taupe-header (app/globals.css).
const headerBackground = "rgb(141, 113, 83)";
const white = "rgb(255, 255, 255)";
const hueso = "rgb(245, 244, 240)";

/** Contraste WCAG entre dos colores rgb(...) como los devuelve getComputedStyle. */
function contrast(a: string, b: string) {
  const luminance = (color: string) => {
    const [r, g, b] = color.match(/\d+/g)!.slice(0, 3).map((value) => {
      const c = Number(value) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const css = (locator: Locator, property: string) =>
  locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

test.describe("Header", () => {
  test("fondo del logo con el menú y el carrito en blanco, con contraste AA", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    const nav = page.getByRole("navigation", { name: "Principal" });
    const cart = page.getByRole("link", { name: /^Carrito/ });

    await expect(header).toHaveCSS("background-color", headerBackground);
    for (const link of await nav.getByRole("link").all()) {
      await expect(link).toHaveCSS("color", white);
    }
    await expect(cart).toHaveCSS("color", white);
    expect(contrast(white, headerBackground)).toBeGreaterThanOrEqual(4.5);

    // Logo blanco sin círculo.
    await expect(header.getByRole("img", { name: "Home Bakery, ir al inicio" })).toHaveAttribute("src", /white/);
  });

  test("página actual, hover y foco visibles sobre el fondo", async ({ page }) => {
    await page.goto("/tienda");
    const nav = page.getByRole("navigation", { name: "Principal" });
    const current = nav.getByRole("link", { name: "Tienda" });
    const other = nav.getByRole("link", { name: "Maggie" });

    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(current).toHaveCSS("border-bottom-color", white);
    await expect(other).toHaveCSS("border-bottom-color", "rgba(0, 0, 0, 0)");

    await other.hover();
    await expect(other).not.toHaveCSS("border-bottom-color", "rgba(0, 0, 0, 0)");

    // Con el teclado: contorno hueso, que da 3:1 o más sobre el fondo.
    await page.mouse.move(0, 500);
    await nav.getByRole("link", { name: "Workshops" }).focus();
    await page.keyboard.press("Tab");
    await expect(other).toBeFocused();
    await expect(other).toHaveCSS("outline-style", "solid");
    await expect(other).toHaveCSS("outline-color", hueso);
    expect(contrast(await css(other, "outline-color"), headerBackground)).toBeGreaterThanOrEqual(3);
  });

  test.describe("en un teléfono", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("el menú desplegable usa el mismo fondo y marca la página actual", async ({ page }) => {
      await page.goto("/workshops");
      const toggle = page.getByRole("button", { name: "Menú" });
      await expect(toggle).toHaveCSS("color", white);

      await toggle.click();
      const menu = page.getByRole("navigation", { name: "Principal" });
      await expect(menu).toHaveCSS("background-color", headerBackground);

      const current = menu.getByRole("link", { name: "Workshops" });
      await expect(current).toHaveAttribute("aria-current", "page");
      await expect(current).toHaveCSS("color", white);
      // Barra blanca a la izquierda solo en la página actual.
      await expect(current.locator("span")).toHaveCSS("background-color", white);
      await expect(menu.getByRole("link", { name: "Tienda" }).locator("span")).toHaveCSS(
        "background-color",
        "rgba(0, 0, 0, 0)",
      );
    });
  });
});
