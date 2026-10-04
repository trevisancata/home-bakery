import { expect, test, type Page } from "@playwright/test";

const carouselName = "Home Bakery: pastelería y workshops";

/** La diapositiva visible: las demás llevan aria-hidden. */
function visibleSlide(page: Page) {
  return page.locator('[aria-roledescription="diapositiva"]:not([aria-hidden="true"])');
}

test.describe("Carrusel de la portada", () => {
  test.describe("sin movimiento reducido", () => {
    test.use({ reducedMotion: "no-preference" });

    test("avanza solo cada 6 s y se frena con el botón de pausa", async ({ page }) => {
      await page.clock.install();
      await page.goto("/");
      const carousel = page.getByRole("region", { name: carouselName });
      await expect(visibleSlide(page)).toHaveAttribute("aria-label", "1 de 3");

      await page.clock.runFor(6_100);
      await expect(visibleSlide(page)).toHaveAttribute("aria-label", "2 de 3");

      await carousel.getByRole("button", { name: "Pausar el carrusel" }).click();
      await expect(carousel.getByRole("button", { name: "Reanudar el carrusel" })).toBeVisible();

      // Sin mouse ni foco adentro: si sigue quieta, es por la pausa.
      await page.mouse.move(0, 0);
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await page.clock.runFor(20_000);
      await expect(visibleSlide(page)).toHaveAttribute("aria-label", "2 de 3");

      await carousel.getByRole("button", { name: "Reanudar el carrusel" }).click();
      await page.mouse.move(0, 0);
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await page.clock.runFor(6_100);
      await expect(visibleSlide(page)).toHaveAttribute("aria-label", "3 de 3");
    });

    test("se maneja con el teclado", async ({ page }) => {
      await page.clock.install();
      await page.goto("/");
      const carousel = page.getByRole("region", { name: carouselName });
      const controls = carousel.getByRole("group", { name: "Controles del carrusel" });

      // Orden de tabulación: anterior, puntos, siguiente, pausa.
      await controls.getByRole("button", { name: "Diapositiva anterior" }).focus();
      for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
      await expect(controls.getByRole("button", { name: "Diapositiva siguiente" })).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(visibleSlide(page)).toHaveAttribute("aria-label", "2 de 3");
      await expect(controls.getByRole("button", { name: "Diapositiva 2" })).toHaveAttribute("aria-current", "true");

      await page.keyboard.press("Shift+Tab");
      await expect(controls.getByRole("button", { name: "Diapositiva 3" })).toBeFocused();
      await page.keyboard.press("Space");
      await expect(visibleSlide(page)).toHaveAttribute("aria-label", "3 de 3");
      await expect(controls.getByRole("button", { name: "Diapositiva 3" })).toHaveAttribute("aria-current", "true");

      // Con el foco adentro no avanza solo.
      await page.clock.runFor(20_000);
      await expect(visibleSlide(page)).toHaveAttribute("aria-label", "3 de 3");

      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(controls.getByRole("button", { name: "Diapositiva anterior" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(visibleSlide(page)).toHaveAttribute("aria-label", "2 de 3");
    });
  });

  test("con movimiento reducido no avanza solo", async ({ page }) => {
    // playwright.config.ts corre con reducedMotion: "reduce".
    await page.clock.install();
    await page.goto("/");
    const carousel = page.getByRole("region", { name: carouselName });

    await expect(carousel.getByRole("button", { name: "Reanudar el carrusel" })).toBeVisible();
    await page.clock.runFor(20_000);
    await expect(visibleSlide(page)).toHaveAttribute("aria-label", "1 de 3");
  });
});
