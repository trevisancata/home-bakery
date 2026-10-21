import type { CookieOptionsWithName } from "@supabase/ssr";

/**
 * Cookies de la sesión de Supabase Auth (access token JWT + refresh token).
 *
 * - httpOnly: el JavaScript del navegador no las puede leer (si hubiera un
 *   XSS, no se roba la sesión). Se puede porque no hay cliente de Supabase en
 *   el navegador: el login y todo el panel pasan por el servidor.
 * - secure: solo viajan por HTTPS. En desarrollo (http://localhost) se
 *   desactiva; en producción siempre van.
 * - sameSite lax: no se mandan en POST desde otros sitios (CSRF).
 */
export const authCookieOptions: CookieOptionsWithName = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};
