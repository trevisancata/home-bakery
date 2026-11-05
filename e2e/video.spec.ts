import { expect, test, type Page } from "@playwright/test";

// La portada de /workshops es la que tiene video (el reel de los workshops).

function hero(page: Page) {
  return page.getByRole("region", { name: "Workshops en la cocina de Maggie" });
}

function heroVideo(page: Page) {
  return hero(page).locator("video");
}

const isPaused = (page: Page) => heroVideo(page).evaluate((video: HTMLVideoElement) => video.paused);

test.describe("Video de fondo de /workshops", () => {
  test.describe("sin movimiento reducido", () => {
    test.use({ reducedMotion: "no-preference" });

    test("se pausa con el ícono, que es chico pero tiene nombre y área táctil", async ({ page }) => {
      await page.goto("/workshops");
      await expect.poll(() => isPaused(page)).toBe(false);

      const pause = page.getByRole("button", { name: "Pausar video" });
      const box = (await pause.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
      // Ya no es el botón grande con texto.
      expect(box.width).toBeLessThan(44);
      await expect(pause).toHaveText("");

      await pause.click();
      await expect.poll(() => isPaused(page)).toBe(true);
      const play = page.getByRole("button", { name: "Reproducir video" });
      await expect(play).toBeVisible();

      await play.click();
      await expect.poll(() => isPaused(page)).toBe(false);
      await expect(page.getByRole("button", { name: "Pausar video" })).toBeVisible();
    });

    test("se pausa y se reanuda con un clic en el video", async ({ page }) => {
      await page.goto("/workshops");
      await expect.poll(() => isPaused(page)).toBe(false);

      await heroVideo(page).click();
      await expect.poll(() => isPaused(page)).toBe(true);
      await expect(page.getByRole("button", { name: "Reproducir video" })).toBeVisible();

      await heroVideo(page).click();
      await expect.poll(() => isPaused(page)).toBe(false);
    });

    test.describe("en un teléfono", () => {
      test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

      test("se pausa tocando el video", async ({ page }) => {
        await page.goto("/workshops");
        await expect.poll(() => isPaused(page)).toBe(false);

        // Arriba del texto: el video ocupa toda la portada.
        const box = (await hero(page).boundingBox())!;
        await page.touchscreen.tap(box.x + box.width / 2, box.y + 150);
        await expect.poll(() => isPaused(page)).toBe(true);

        await page.getByRole("button", { name: "Reproducir video" }).tap();
        await expect.poll(() => isPaused(page)).toBe(false);
      });
    });
  });

  test("con movimiento reducido se queda en el póster", async ({ page }) => {
    // playwright.config.ts corre con reducedMotion: "reduce".
    await page.goto("/workshops");
    await expect(page.getByRole("button", { name: "Reproducir video" })).toBeVisible();
    await expect(heroVideo(page)).not.toHaveAttribute("autoplay");
    await expect(heroVideo(page)).toHaveAttribute("preload", "none");
    expect(await isPaused(page)).toBe(true);
  });
});
