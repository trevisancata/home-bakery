import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/server-auth";

/**
 * Destino del link del mail de recuperación de contraseña. Acepta las dos
 * formas de link que puede mandar Supabase:
 *
 * - `?code=` (flujo PKCE, plantilla por defecto con {{ .ConfirmationURL }}):
 *   se canjea con exchangeCodeForSession. Solo funciona en el mismo navegador
 *   donde se pidió el link, porque el "code verifier" quedó en una cookie.
 * - `?token_hash=&type=recovery` (plantilla propia, ver README): se canjea
 *   con verifyOtp y funciona en cualquier navegador.
 *   TODO(SMTP): pasar a esta plantilla cuando haya SMTP propio.
 *
 * Si el link venció, ya se usó o se abrió en otro navegador, vuelve a
 * /admin/recuperar con el aviso y el botón para pedir otro.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");

  // Supabase manda ?error=…&error_code=otp_expired cuando el link ya no sirve.
  if (!params.get("error") && (code || (tokenHash && type === "recovery"))) {
    const supabase = await createAuthClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash! });
    if (!error) redirect("/admin/nueva-contrasena");
    console.error(`Error al verificar el link de recuperación (${error.code ?? "sin código"})`);
  }
  redirect("/admin/recuperar?error=link");
}
