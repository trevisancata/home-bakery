import type { MetadataRoute } from "next";

// El sitemap y el robots.txt del sitio público, como funciones puras para
// poder testearlas sin servidor ni base (app/sitemap.ts y app/robots.ts les
// pasan la URL del sitio y los productos).

/** Producto activo y la última vez que cambió (él, sus tamaños o sus fotos). */
export type ProductoSitemap = { slug: string; updatedAt: Date };

/** Páginas que no se indexan: el panel, el pedido en curso y la API. */
export const rutasPrivadas = ["/admin", "/carrito", "/pedido", "/api"];

/**
 * Inicio, tienda, cada producto activo, workshops y Maggie. El inicio y la
 * tienda cambian con el último producto; workshops y Maggie no tienen una
 * fecha propia en la base, así que llevan la de cuando se generó el sitemap.
 */
export function sitemapEntries(baseUrl: string, productos: ProductoSitemap[], ahora: Date): MetadataRoute.Sitemap {
  const ultimoProducto = productos.reduce<Date | null>(
    (ultimo, producto) => (ultimo && ultimo >= producto.updatedAt ? ultimo : producto.updatedAt),
    null,
  );
  const catalogo = ultimoProducto ?? ahora;
  return [
    { url: `${baseUrl}/`, lastModified: catalogo, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/tienda`, lastModified: catalogo, changeFrequency: "weekly", priority: 0.9 },
    ...productos.map((producto) => ({
      url: `${baseUrl}/tienda/${encodeURIComponent(producto.slug)}`,
      lastModified: producto.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${baseUrl}/workshops`, lastModified: ahora, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/maggie`, lastModified: ahora, changeFrequency: "yearly", priority: 0.5 },
  ];
}

/** Todo permitido salvo las rutas privadas, con el link al sitemap. */
export function robotsRules(baseUrl: string): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: rutasPrivadas },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
