import { expect, test, type Locator } from "@playwright/test";

// Header, footer y barra de avisos. Fondo del header y del footer:
// --color-taupe-header (app/globals.css).
const headerBackground = "rgb(141, 113, 83)";
const white = "rgb(255, 255, 255)";
const hueso = "rgb(245, 244, 240)";
const carbon = "rgb(47, 47, 47)";

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

/** Color y tamaño de cada elemento con texto propio y visible adentro de `root`. */
const textos = (root: Locator) =>
  root.evaluate((element) =>
    [...element.querySelectorAll("*")]
      .filter((el) => [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim()))
      .filter((el) => (el as HTMLElement).offsetParent !== null || getComputedStyle(el).position === "fixed")
      .map((el) => ({ texto: el.textContent!.trim().slice(0, 30), color: getComputedStyle(el).color, size: getComputedStyle(el).fontSize })),
  );

test.describe("Footer", () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    test(`mismo fondo que el header y todo el texto en blanco, con AA (${viewport.width} px)`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      const footer = page.locator("footer");
      await expect(footer).toHaveCSS("background-color", headerBackground);

      const lista = await textos(footer);
      expect(lista.length).toBeGreaterThan(viewport.width < 768 ? 2 : 8);
      // También el más chico (el copyright de 13 px en mobile).
      for (const { texto, color } of lista) {
        expect(color, texto).toBe(white);
        expect(contrast(color, headerBackground), texto).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  test("hover y foco visibles en los links", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const link = page.getByRole("navigation", { name: "Secundaria" }).getByRole("link").first();

    // Desde md, sin hover no llevan subrayado; con hover, sí.
    await expect(link).toHaveCSS("text-decoration-line", "none");
    await link.hover();
    await expect(link).toHaveCSS("text-decoration-line", "underline");

    // Con el teclado: contorno hueso (3:1 o más sobre el fondo).
    await page.mouse.move(0, 0);
    await link.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-style", "solid");
    await expect(link).toHaveCSS("outline-color", hueso);
    expect(contrast(hueso, headerBackground)).toBeGreaterThanOrEqual(3);
  });
});

test.describe("Barra de avisos", () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    test(`fondo blanco con texto oscuro, con AA, y se distingue del header (${viewport.width} px)`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      const barra = page.getByRole("complementary", { name: "Avisos" });
      await expect(barra).toHaveCSS("background-color", white);
      await expect(barra).toContainText("48 h");

      const lista = await textos(barra);
      expect(lista.length).toBeGreaterThan(0);
      for (const { texto, color } of lista) {
        expect(color, texto).toBe(carbon);
        expect(contrast(color, white), texto).toBeGreaterThanOrEqual(4.5);
      }
      // Pegada al header, pero con un fondo bien distinto.
      expect(contrast(white, await css(page.locator("header"), "background-color"))).toBeGreaterThanOrEqual(3);
    });
  }
});

