import { expect, test, type Page } from "@playwright/test";

const carouselName = "Home Bakery: pastelería y workshops";

/** La diapositiva visible: las demás llevan aria-hidden. */
function visibleSlide(page: Page) {
  return page.locator('[aria-roledescription="diapositiva"]:not([aria-hidden="true"])');
}

function carousel(page: Page) {
  return page.getByRole("region", { name: carouselName });
}

/** El aviso de aria-live: "Foto 2 de 3". */
function announcement(page: Page) {
  return carousel(page).locator('[aria-live="polite"]');
}

/** Un punto vacío del carrusel (arriba, entre las flechas y lejos de los textos). */
async function emptySpot(page: Page) {
  const box = (await carousel(page).boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height * 0.2 };
}

test.describe("Carrusel de la portada", () => {
  test.describe("sin movimiento reducido", () => {
    test.use({ reducedMotion: "no-preference" });

    test("no avanza solo y no tiene botón de pausa", async ({ page }) => {
      await page.clock.install();
      await page.goto("/");
      await expect(visibleSlide(page)).toHaveAttribute("aria-label", "1 de 3");

      // Sin mouse ni foco adentro, que antes también lo frenaban.
      await page.mouse.move(0, 0);
      await page.clock.runFor(30_000);
      await expect(visibleSlide(page)).toHaveAttribute("aria-label", "1 de 3");
      await expect(carousel(page).getByRole("button", { name: /pausar|reanudar/i })).toHaveCount(0);
      // Al cargar no se anuncia nada.
      await expect(announcement(page)).toHaveText("");
    });
  });

  test("las flechas cambian de foto, dan la vuelta y lo anuncian", async ({ page }) => {
    await page.goto("/");
    const next = carousel(page).getByRole("button", { name: "Foto siguiente" });
    const previous = carousel(page).getByRole("button", { name: "Foto anterior" });

    await next.click();
    await expect(visibleSlide(page)).toHaveAttribute("aria-label", "2 de 3");
    await expect(announcement(page)).toHaveText("Foto 2 de 3");

    await previous.click();
    await previous.click();
    await expect(visibleSlide(page)).toHaveAttribute("aria-label", "3 de 3");
    await expect(announcement(page)).toHaveText("Foto 3 de 3");
  });

  test("los puntos marcan la foto actual y son decorativos", async ({ page }) => {
    await page.goto("/");
    const dots = page.getByTestId("carrusel-puntos");
    const current = dots.locator("[data-actual]");

    await expect(dots).toHaveAttribute("aria-hidden", "true");
    await expect(dots.locator("span")).toHaveCount(3);
    await expect(current).toHaveCount(1);
    await expect(dots.locator("span").nth(0)).toHaveAttribute("data-actual", "");

    await carousel(page).getByRole("button", { name: "Foto siguiente" }).click();
    await expect(dots.locator("span").nth(1)).toHaveAttribute("data-actual", "");
    await expect(current).toHaveCount(1);
    // No se pueden tocar ni enfocar: los controles son las flechas y el swipe.
    await expect(dots.locator("button")).toHaveCount(0);
    await expect(dots).toHaveCSS("pointer-events", "none");
  });

  test("se maneja con el teclado y el foco se ve", async ({ page }) => {
    await page.goto("/");
    const next = carousel(page).getByRole("button", { name: "Foto siguiente" });
    const previous = carousel(page).getByRole("button", { name: "Foto anterior" });

    // Desde el último botón de la portada, Tab llega a las flechas.
    await carousel(page).getByRole("link", { name: "Conocé los workshops" }).focus();
    await page.keyboard.press("Tab");
    await expect(previous).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(next).toBeFocused();
    // Foco visible: contorno hueso de 3 px (data-surface="dark").
    await expect(next).toHaveCSS("outline-style", "solid");
    await expect(next).toHaveCSS("outline-color", "rgb(245, 244, 240)");

    await page.keyboard.press("Enter");
    await expect(visibleSlide(page)).toHaveAttribute("aria-label", "2 de 3");
    await page.keyboard.press("Space");
    await expect(visibleSlide(page)).toHaveAttribute("aria-label", "3 de 3");
    await expect(announcement(page)).toHaveText("Foto 3 de 3");

    await page.keyboard.press("Shift+Tab");
    await expect(previous).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(visibleSlide(page)).toHaveAttribute("aria-label", "2 de 3");
  });

  test("se arrastra con el mouse", async ({ page }) => {
    await page.goto("/");
    const { x, y } = await emptySpot(page);

    // Hacia la izquierda: la siguiente.
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 150, y, { steps: 5 });
    await page.mouse.up();
    await expect(visibleSlide(page)).toHaveAttribute("aria-label", "2 de 3");
    await expect(announcement(page)).toHaveText("Foto 2 de 3");

    // Hacia la derecha: la anterior.
    await page.mouse.move(x - 150, y);
    await page.mouse.down();
    await page.mouse.move(x, y, { steps: 5 });
    await page.mouse.up();
    await expect(visibleSlide(page)).toHaveAttribute("aria-label", "1 de 3");

    // Un movimiento corto o vertical es un clic o un scroll, no cambia.
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 20, y + 120, { steps: 5 });
    await page.mouse.up();
    await expect(visibleSlide(page)).toHaveAttribute("aria-label", "1 de 3");
  });

  test.describe("en un teléfono", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("se desliza con el dedo", async ({ page }) => {
      await page.goto("/");
      const { x, y } = await emptySpot(page);
      // Toques reales (CDP): el navegador genera los pointer events como en un teléfono.
      const cdp = await page.context().newCDPSession(page);
      const swipe = async (fromX: number, toX: number) => {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: fromX, y }] });
        for (let i = 1; i <= 5; i++) {
          const at = fromX + ((toX - fromX) * i) / 5;
          await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: at, y }] });
        }
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      };

      await swipe(x + 120, x - 120);
      await expect(visibleSlide(page)).toHaveAttribute("aria-label", "2 de 3");
      await expect(announcement(page)).toHaveText("Foto 2 de 3");

      await swipe(x - 120, x + 120);
      await expect(visibleSlide(page)).toHaveAttribute("aria-label", "1 de 3");

      // Las flechas también están, con 44 px de área táctil.
      const next = carousel(page).getByRole("button", { name: "Foto siguiente" });
      const box = (await next.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      await next.tap();
      await expect(visibleSlide(page)).toHaveAttribute("aria-label", "2 de 3");
    });
  });
});
