import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { authCookieOptions } from "@/lib/supabase/cookies";
import { requireEnv } from "@/lib/supabase/env";

// La "aduana" del panel: corre antes de cada pedido a /admin y a la API de
// admin. Renueva la sesión (si el access token está por vencer, Supabase
// emite uno nuevo y se guarda en las cookies) y frena a quien no tiene
// sesión. Es un control optimista: el rol se vuelve a verificar en cada
// layout, página, handler y Server Action (lib/auth.ts), y RLS en la base.
//
// Las páginas públicas quedan afuera del matcher: no leen cookies y siguen
// estáticas con ISR.

/** Pantallas de /admin que se ven sin sesión. */
const rutasAbiertas = ["/admin/ingresar", "/admin/recuperar", "/admin/auth/confirm"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Las cookies nuevas van al request (para los Server Components de
          // este mismo pedido) y a la respuesta (para el navegador).
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          // Cache-Control: no-store: una respuesta con la sesión no se cachea.
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
        },
      },
    },
  );

  // Nada entre createServerClient y getClaims (lo pide @supabase/ssr).
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims?.sub);

  const { pathname, search } = request.nextUrl;
  const esApi = pathname.startsWith("/api/");
  const abierta = rutasAbiertas.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));

  if (!conSesion && esApi) {
    return conCookies(
      response,
      NextResponse.json(
        { error: { message: "Tenés que ingresar para seguir." } },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      ),
    );
  }

  if (!conSesion && !abierta) {
    const login = new URL("/admin/ingresar", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return conCookies(response, NextResponse.redirect(login));
  }

  if (conSesion && pathname === "/admin/ingresar") {
    return conCookies(response, NextResponse.redirect(new URL("/admin", request.url)));
  }

  return response;
}

/** Una respuesta nueva tiene que llevar las cookies que haya renovado Supabase. */
function conCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) to.cookies.set(cookie);
  return to;
}

export const config = {
  matcher: ["/admin/:path*", "/api/v1/admin/:path*"],
};
