import { expect, hasSupabase, skipReason, test } from "./support/supabase";

// El sitemap y el robots.txt servidos por el build de producción, con la URL
// del sitio de la corrida (NEXT_PUBLIC_SITE_URL en playwright.config.ts).

test.describe("GET /sitemap.xml", () => {
  test.skip(!hasSupabase, skipReason);

  test("es XML con las páginas públicas y los productos activos, con su fecha", async ({ request, baseURL }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("xml");
    const xml = await response.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    for (const path of ["/", "/tienda", "/workshops", "/maggie"]) expect(urls).toContain(`${baseURL}${path}`);
    expect(urls.some((url) => url.startsWith(`${baseURL}/tienda/`))).toBe(true);
    expect(urls.filter((url) => /\/(admin|carrito|pedido|api)(\/|$)/.test(new URL(url).pathname))).toEqual([]);
    expect(xml.match(/<lastmod>/g)?.length).toBe(urls.length);
  });
});

test.describe("GET /robots.txt", () => {
  test("deja afuera las rutas privadas y apunta al sitemap", async ({ request, baseURL }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain("User-Agent: *");
    expect(text).toContain("Allow: /");
    for (const path of ["/admin", "/carrito", "/pedido", "/api"]) expect(text).toContain(`Disallow: ${path}`);
    expect(text).toContain(`Sitemap: ${baseURL}/sitemap.xml`);
  });
});
