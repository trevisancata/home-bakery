"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { admin } from "@/data/admin";
import { safeNext } from "@/lib/auth";
import { blockedMinutes, clearFailures, clientIp, registerFailure } from "@/lib/rate-limit";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { firstErrors, loginSchema, newPasswordSchema, recoverSchema } from "@/lib/validation/admin-auth";

// Acciones de acceso al panel. Next verifica que las Server Actions vengan
// del mismo origen (Origin = Host), así que no hace falta un token CSRF.

export type FormState = {
  /** Error general, arriba del formulario. */
  error?: string;
  /** Errores por campo. */
  fields?: Record<string, string>;
  /** Aviso de éxito (recuperación). */
  notice?: string;
  /** Email ingresado, para no tener que escribirlo de nuevo. */
  email?: string;
};

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

/** Registra solo el código del error de Supabase, nunca el email ni la contraseña. */
function logAuthError(context: string, error: { code?: string; status?: number }) {
  console.error(`${context} (${error.code ?? error.status ?? "sin código"})`);
}

export async function ingresar(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email");
  const ip = clientIp(await headers());

  const minutes = blockedMinutes(ip);
  if (minutes !== null) return { error: admin.login.errors.tooMany(minutes), email };

  const parsed = loginSchema.safeParse({ email, password: text(formData, "password") });
  if (!parsed.success) return { fields: firstErrors(parsed.error), email };

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // El límite de Supabase Auth (429) también se muestra como "demasiados intentos".
    if (error.status === 429) return { error: admin.login.errors.tooManyLater, email };
    // Credenciales inválidas, email sin confirmar, usuaria inexistente: el
    // mismo mensaje para todo, así no se puede averiguar qué emails existen.
    registerFailure(ip);
    if (error.code !== "invalid_credentials") logAuthError("Error al ingresar", error);
    return { error: admin.login.errors.credentials, email };
  }

  clearFailures(ip);
  redirect(safeNext(text(formData, "next")));
}

export async function recuperar(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email");
  const parsed = recoverSchema.safeParse({ email });
  if (!parsed.success) return { fields: firstErrors(parsed.error), email };

  // El link del mail vuelve a /admin/auth/confirm de este mismo sitio
  // (local, preview o producción). Supabase solo acepta las URLs cargadas
  // en Redirect URLs, así que un Host falso no sirve para desviar el link.
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const supabase = await createAuthClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/admin/auth/confirm`,
  });
  if (error) {
    logAuthError("Error al pedir el link de recuperación", error);
    // Un email que no existe no da error: esto es un problema real (límite de mails, SMTP).
    return { error: admin.recover.unexpected, email };
  }
  return { notice: admin.recover.sent };
}

export async function nuevaContrasena(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({
    password: text(formData, "password"),
    confirm: text(formData, "confirm"),
  });
  if (!parsed.success) return { fields: firstErrors(parsed.error) };

  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/admin/ingresar");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "weak_password") return { fields: { password: admin.newPassword.errors.short } };
    logAuthError("Error al cambiar la contraseña", error);
    return { error: admin.newPassword.errors.unexpected };
  }
  redirect("/admin");
}

export async function cerrarSesion() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/ingresar");
}
