// Variables de entorno de Supabase. Si falta alguna, el error dice cuál,
// nunca su valor. Ver .env.example y el README.

type EnvName = "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" | "SUPABASE_SECRET_KEY";

// Las NEXT_PUBLIC_ se leen con nombre literal para que Next las pueda
// reemplazar en el build.
const values: Record<EnvName, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
};

export function requireEnv(name: EnvName) {
  const value = values[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Copiá .env.example a .env.local y completala.`);
  }
  return value;
}
