// Usuarias de prueba para los e2e del panel: una admin y una sin rol. Se
// crean con la secret key (auth.admin.createUser, ya confirmadas) al empezar
// la corrida y se borran al final.
//
// Las contraseñas son aleatorias, viajan solo en process.env (de
// globalSetup a los workers) y nunca se imprimen ni se guardan en archivos.

import { randomBytes } from "node:crypto";
import { admin } from "./supabase";

export const testEmailPrefix = "e2e-";
export const testEmailDomain = "@example.com";

export type TestUser = { email: string; password: string };

export const authFile = { admin: "e2e/.auth/admin.json", sinRol: "e2e/.auth/sin-rol.json" } as const;

const env = {
  admin: { email: "E2E_ADMIN_EMAIL", password: "E2E_ADMIN_PASSWORD" },
  sinRol: { email: "E2E_SINROL_EMAIL", password: "E2E_SINROL_PASSWORD" },
} as const;

/** La usuaria de prueba de cada rol (la creó globalSetup). */
export function testUser(kind: keyof typeof env): TestUser {
  const email = process.env[env[kind].email];
  const password = process.env[env[kind].password];
  if (!email || !password) throw new Error("Faltan las usuarias de prueba: ¿corrió globalSetup?");
  return { email, password };
}

async function crearUsuaria(kind: keyof typeof env, run: string, rol: "admin" | null) {
  const email = `${testEmailPrefix}${kind === "admin" ? "admin" : "sinrol"}-${run}${testEmailDomain}`;
  const password = randomBytes(24).toString("base64url");
  const client = admin();
  const { data, error } = await client.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`No se pudo crear la usuaria de prueba (${error.code ?? error.status})`);
  if (rol) {
    const perfil = await client.from("perfiles").insert({ id: data.user.id, nombre: "Prueba E2E", rol });
    if (perfil.error) throw new Error(`No se pudo asignar el rol de prueba (${perfil.error.code}): ¿está corrida la migración 0002?`);
  }
  process.env[env[kind].email] = email;
  process.env[env[kind].password] = password;
}

export async function crearUsuariasDePrueba() {
  const run = `${Date.now()}-${randomBytes(3).toString("hex")}`;
  await crearUsuaria("admin", run, "admin");
  await crearUsuaria("sinRol", run, null);
}

/** Borra todas las usuarias "e2e-…@example.com" (sus perfiles se borran en cascada). */
export async function borrarUsuariasDePrueba() {
  const client = admin();
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`No se pudieron listar las usuarias (${error.code ?? error.status})`);
    const prueba = data.users.filter(
      (user) => user.email?.startsWith(testEmailPrefix) && user.email.endsWith(testEmailDomain),
    );
    for (const user of prueba) {
      const { error: deleteError } = await client.auth.admin.deleteUser(user.id);
      if (deleteError) throw new Error(`No se pudo borrar una usuaria de prueba (${deleteError.code ?? deleteError.status})`);
    }
    if (data.users.length < 1000) break;
  }
}
