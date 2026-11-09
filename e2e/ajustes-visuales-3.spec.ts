import { expect, test, type Page } from "@playwright/test";
import { pedidos, whatsappMessages } from "../data/site";
import { formatPrice } from "../lib/format";

// Ajustes visuales 3: "Cómo pedir" en tres pasos, foto en la banda de
// workshops, recuadro de la tienda, datos de "Cómo es un workshop" en una
// línea y las fotos de /maggie.

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

/** Espera el evento load: las fotos diferidas se piden recién ahí. */
async function cargar(page: Page, url: string) {
  await page.goto(url, { waitUntil: "load" });
}

test.describe("Inicio", () => {
  test("Cómo pedir tiene tres pasos, sin el de pagar online", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const seccion = page.getByRole("region", { name: "Simple, como en casa" });
    const pasos = seccion.getByRole("listitem");
    await expect(pasos).toHaveCount(3);
    // innerText: Adaptive tiene la versión de mobile oculta en el DOM.
    expect(await pasos.getByRole("heading", { level: 3 }).allInnerTexts()).toEqual([
      "Elegí y encargá",
      "Confirmamos tu pedido",
      "Retirá o recibí",
    ]);
    await expect(seccion.getByText(/Pagá/)).toHaveCount(0);
    // En desktop, los tres en una fila.
    const tops = await pasos.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().top));
    expect(new Set(tops).size).toBe(1);
  });

  test.describe("en un teléfono", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("Cómo pedir usa los títulos cortos", async ({ page }) => {
      await page.goto("/");
      const pasos = page.getByRole("region", { name: "Simple, como en casa" }).getByRole("listitem");
      expect(await pasos.getByRole("heading", { level: 3 }).allInnerTexts()).toEqual([
        "Elegí y encargá",
        "Maggie lo confirma",
        "Retirá o recibí",
      ]);
    });
  });

  test("la banda de workshops tiene la foto del grupo, sin video", async ({ page }) => {
    await cargar(page, "/");
    const banda = page.getByRole("region", { name: "Grupos reducidos en mi cocina" });
    const foto = banda.getByRole("img", {
      name: "Alumnas cocinando y riéndose alrededor de la mesada en un workshop de Maggie",
    });
    await expect(foto).toHaveAttribute("src", /inicio-workshops-grupo/);
    await expect(foto).toHaveClass(/object-\[50%_47%\]/);
    await expect(banda.locator("video")).toHaveCount(0);
    // No compite con la portada: no tiene preload.
    await expect(page.locator('link[rel="preload"][imagesrcset*="inicio-workshops-grupo"]')).toHaveCount(0);
  });
});

test.describe("Tienda", () => {
  test("sin párrafo inicial; el recuadro tiene un dato por línea, desde las reglas de pedidos", async ({ page }) => {
    await page.goto("/tienda");
    await expect(page.getByText("Todo se hornea por encargo")).toHaveCount(0);

    const datos = page.locator("dl").first().locator(":scope > div");
    await expect(datos).toHaveText([
      `Anticipación: ${pedidos.anticipacionHoras} h`,
      `Retiro: ${pedidos.diasRetiro}, San Isidro`,
      `Envío: pedidos desde ${formatPrice(pedidos.entrega.envio.minimo)}, hasta ${pedidos.entrega.envio.radioKm} km`,
    ]);
    // Cada uno en su propia línea.
    const tops = await datos.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().top));
    expect(tops[0]).toBeLessThan(tops[1]);
    expect(tops[1]).toBeLessThan(tops[2]);
  });

  test("debajo del recuadro, el presupuesto para eventos por WhatsApp", async ({ page }) => {
    await page.goto("/tienda");
    const recuadro = (await page.locator("dl").first().boundingBox())!;
    const linea = page.getByText("¿Es para un evento?");
    await expect(linea).toBeVisible();
    expect((await linea.boundingBox())!.y).toBeGreaterThan(recuadro.y + recuadro.height);

    const link = linea.getByRole("link", { name: "Pedí presupuesto por WhatsApp" });
    const href = new URL((await link.getAttribute("href"))!);
    expect(href.hostname).toBe("wa.me");
    expect(href.searchParams.get("text")).toBe(whatsappMessages.event);
  });
});

test.describe("Cómo es un workshop", () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    test(`los datos van en una línea de texto, sin cajas y con contraste AA (${viewport.width} px)`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/workshops");
      const seccion = page.getByRole("region", { name: "Cómo es un workshop" });
      const linea = seccion.getByText("2 h aprox · Hasta 8 personas · En mi cocina de San Isidro", { exact: true });
      await expect(linea).toBeVisible();
      await expect(seccion.getByText("Pagás el total al inscribirte")).toHaveCount(0);

      const estilos = await linea.evaluate((el) => {
        const propio = getComputedStyle(el);
        const fondo = getComputedStyle(el.closest("section")!).backgroundColor;
        return {
          color: propio.color,
          fondoPropio: propio.backgroundColor,
          fondo,
          alto: el.getBoundingClientRect().height,
          linea: Number.parseFloat(propio.lineHeight) || Number.parseFloat(propio.fontSize) * 1.5,
          hijos: el.children.length,
        };
      });
      // Sin cajas: ni fondo propio ni elementos adentro.
      expect(estilos.fondoPropio).toBe("rgba(0, 0, 0, 0)");
      expect(estilos.hijos).toBe(0);
      expect(contrast(estilos.color, estilos.fondo)).toBeGreaterThanOrEqual(4.5);
      // Una sola línea en desktop.
      if (viewport.width >= 1024) expect(estilos.alto).toBeLessThan(estilos.linea * 1.5);
    });
  }
});

test.describe("Maggie", () => {
  const alts = [
    "Maggie sonríe en su cocina durante un workshop",
    "Maggie explica una receta a sus alumnas",
    "Maggie corta una tarta en su cocina, con bandejas de masas y cuadrados",
  ];

  test("las tres fotos, después del load, sin repetir la de la portada", async ({ page }) => {
    await cargar(page, "/maggie");
    const galeria = page.getByRole("region", { name: "Fotos de Maggie" });
    const fotos = galeria.getByRole("img");
    await expect(fotos).toHaveCount(3);
    for (const [i, alt] of alts.entries()) {
      await expect(fotos.nth(i)).toHaveAccessibleName(alt);
      await expect(fotos.nth(i)).toHaveAttribute("src", new RegExp(`maggie-${i + 1}-`));
      await expect(fotos.nth(i)).toHaveAttribute("loading", "lazy");
    }
    await expect(galeria.locator('img[src*="maggie-presentacion"]')).toHaveCount(0);
    // Solo el retrato de la portada tiene preload.
    await expect(page.locator('link[rel="preload"][as="image"][imagesrcset*="maggie-"]')).toHaveCount(1);
  });

  test.describe("en un teléfono", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("la galería se desliza en horizontal y se puede enfocar", async ({ page }) => {
      await cargar(page, "/maggie");
      const galeria = page.getByRole("region", { name: "Fotos de Maggie" });
      await expect(galeria).toHaveAttribute("tabindex", "0");
      const { scroll, ancho } = await galeria.evaluate((el) => ({ scroll: el.scrollWidth, ancho: el.clientWidth }));
      expect(scroll).toBeGreaterThan(ancho);
      // La página no se desborda.
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    });
  });

  test("en desktop van en tres columnas", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await cargar(page, "/maggie");
    const items = page.getByRole("region", { name: "Fotos de Maggie" }).getByRole("listitem");
    const cajas = await items.evaluateAll((els) =>
      els.map((el) => ({ top: el.getBoundingClientRect().top, left: el.getBoundingClientRect().left })),
    );
    expect(new Set(cajas.map((c) => c.top)).size).toBe(1);
    expect(cajas[0].left).toBeLessThan(cajas[1].left);
    expect(cajas[1].left).toBeLessThan(cajas[2].left);
  });
});
