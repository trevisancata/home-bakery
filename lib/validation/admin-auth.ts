// Esquemas del login y del cambio de contraseña del panel. Los usan las
// Server Actions de app/admin/actions.ts.

import { z } from "zod";
import { admin } from "@/data/admin";

const email = z
  .string({ error: admin.login.errors.email })
  .trim()
  .min(1, { error: admin.login.errors.email })
  .max(254, { error: admin.login.errors.emailFormat })
  .pipe(z.email({ error: admin.login.errors.emailFormat }));

export const loginSchema = z.object({
  email,
  // Sin trim: los espacios son parte de la contraseña.
  password: z.string({ error: admin.login.errors.password }).min(1, { error: admin.login.errors.password }).max(200),
});

export const recoverSchema = z.object({ email });

export const newPasswordSchema = z
  .object({
    // bcrypt usa los primeros 72 bytes: más largo no suma seguridad.
    password: z
      .string()
      .min(8, { error: admin.newPassword.errors.short })
      .max(72, { error: admin.newPassword.errors.long }),
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    error: admin.newPassword.errors.mismatch,
    path: ["confirm"],
  });

/** El primer error de cada campo. */
export function firstErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !result[field]) result[field] = issue.message;
  }
  return result;
}
