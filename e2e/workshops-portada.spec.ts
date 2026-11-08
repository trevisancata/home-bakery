import { expect, test, type Page } from "@playwright/test";

// Portada de /workshops con foto (antes, el reel en video) y "Cómo enseño"
// solo con el texto.

function hero(page: Page) {
  return page.getByRole("region", { name: "Workshops en la cocina de Maggie" });
}

const alt = "Una alumna decora una number cake con merenguitos en el workshop";

test.describe("Portada de /workshops", () => {
  test("es una foto con alt y preload, sin video ni ícono de pausa", async ({ page }) => {
    await page.goto("/workshops");
    const foto = hero(page).getByRole("img", { name: alt });
    await expect(foto).toBeVisible();
    await expect(foto).toHaveAttribute("src", /workshops-portada/);
    await expect(page.locator('link[rel="preload"][as="image"][imagesrcset*="workshops-portada"]')).toHaveCount(1);

    await expect(page.locator("video")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Pausar video|Reproducir video/ })).toHaveCount(0);
  });

  test.describe("en un teléfono", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("la foto va de fondo, a todo el ancho de la portada", async ({ page }) => {
      await page.goto("/workshops");
      const portada = (await hero(page).boundingBox())!;
      const foto = (await hero(page).getByRole("img", { name: alt }).boundingBox())!;
      expect(foto.width).toBeCloseTo(portada.width, 0);
      expect(foto.height).toBeCloseTo(portada.height, 0);
      // El texto queda encima, legible sobre la capa oscura.
      await expect(hero(page).getByRole("heading", { level: 1 })).toBeVisible();
    });
  });

  test("en desktop la foto va enmarcada al lado del texto", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/workshops");
    const portada = (await hero(page).boundingBox())!;
    const marco = hero(page).getByRole("img", { name: alt }).locator("..");
    const caja = (await marco.boundingBox())!;
    expect(caja.width).toBeLessThan(portada.width / 2);
    expect(caja.x).toBeGreaterThan(portada.x + portada.width / 2);
    expect(Number.parseFloat(await marco.evaluate((el) => getComputedStyle(el).borderTopLeftRadius))).toBeGreaterThan(0);
  });
});

test.describe("Cómo enseño", () => {
  test("queda solo el texto: sin firma ni foto", async ({ page }) => {
    await page.goto("/workshops");
    const seccion = page.getByRole("region", { name: "Cómo enseño" });
    await expect(seccion.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(seccion.locator("p")).toHaveCount(2);
    await expect(seccion.locator(".manuscrita")).toHaveCount(0);
    await expect(seccion.locator("img")).toHaveCount(0);
    await expect(seccion.getByText("Foto próximamente")).toHaveCount(0);
  });
});
