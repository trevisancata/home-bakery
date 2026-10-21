// URL pública del sitio, para armar los links que salen hacia afuera
// (back_urls y notification_url de Mercado Pago).

type Env = Partial<Record<"NEXT_PUBLIC_SITE_URL" | "VERCEL_URL", string>>;

/**
 * NEXT_PUBLIC_SITE_URL (producción) o, si no está, la URL del deploy de
 * Vercel (previews) o, si tampoco, localhost. Sin barra final.
 */
export function siteUrl(env: Env = { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL, VERCEL_URL: process.env.VERCEL_URL }) {
  const url = env.NEXT_PUBLIC_SITE_URL || (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}
