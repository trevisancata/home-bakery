import { expect, test } from "@playwright/test";
import { robotsRules, rutasPrivadas, sitemapEntries } from "../lib/seo";

const base = "https://home-bakery.example";
const ahora = new Date("2026-11-09T12:00:00Z");
const productos = [
  { slug: "torta-de-chocolate", updatedAt: new Date("2026-10-01T10:00:00Z") },
  { slug: "budin-de-limon", updatedAt: new Date("2026-11-02T18:30:00Z") },
];

test.describe("Sitemap", () => {
  test("lista inicio, tienda, cada producto activo, workshops y Maggie", () => {
    expect(sitemapEntries(base, productos, ahora).map((entry) => entry.url)).toEqual([
      `${base}/`,
      `${base}/tienda`,
      `${base}/tienda/torta-de-chocolate`,
      `${base}/tienda/budin-de-limon`,
      `${base}/workshops`,
      `${base}/maggie`,
    ]);
  });

  test("cada producto lleva su fecha; inicio y tienda, la del último que cambió", () => {
    const entries = sitemapEntries(base, productos, ahora);
    const fecha = (url: string) => entries.find((entry) => entry.url === `${base}${url}`)?.lastModified;
    expect(fecha("/tienda/torta-de-chocolate")).toEqual(productos[0].updatedAt);
    expect(fecha("/tienda/budin-de-limon")).toEqual(productos[1].updatedAt);
    expect(fecha("/")).toEqual(productos[1].updatedAt);
    expect(fecha("/tienda")).toEqual(productos[1].updatedAt);
    expect(fecha("/workshops")).toEqual(ahora);
    expect(fecha("/maggie")).toEqual(ahora);
  });

  test("sin productos, todo lleva la fecha de generación", () => {
    const entries = sitemapEntries(base, [], ahora);
    expect(entries.map((entry) => entry.url)).toEqual([`${base}/`, `${base}/tienda`, `${base}/workshops`, `${base}/maggie`]);
    for (const entry of entries) expect(entry.lastModified).toEqual(ahora);
  });

  test("no incluye ninguna ruta privada", () => {
    for (const { url } of sitemapEntries(base, productos, ahora)) {
      const path = new URL(url).pathname;
      for (const privada of rutasPrivadas) expect(path.startsWith(privada), url).toBe(false);
    }
  });
});

test.describe("robots.txt", () => {
  test("permite todo salvo el panel, el carrito, el pedido y la API, con el link al sitemap", () => {
    expect(robotsRules(base)).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/carrito", "/pedido", "/api"] },
      sitemap: `${base}/sitemap.xml`,
    });
  });
});
