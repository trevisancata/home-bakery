import type { MetadataRoute } from "next";
import { getSitemapProducts } from "@/lib/data";
import { sitemapEntries } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";

// Como la tienda: ISR de 5 minutos, y el panel lo regenera al instante
// cuando cambia un producto (lib/admin/revalidar.ts).
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapEntries(siteUrl(), await getSitemapProducts(), new Date());
}
