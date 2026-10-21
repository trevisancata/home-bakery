import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/server-auth";

/**
 * Destino del link del mail de recuperación de contraseña. La plantilla
 * "Reset password" de Supabase arma el link con el token_hash (ver README):
 * se canjea por una sesión y se pasa a elegir la contraseña nueva. Funciona
 * aunque el mail se abra en otro navegador o en el celular.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  if (tokenHash && type === "recovery") {
    const supabase = await createAuthClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect("/admin/nueva-contrasena");
    console.error(`Error al verificar el link de recuperación (${error.code ?? "sin código"})`);
  }
  redirect("/admin/recuperar?error=link");
}
