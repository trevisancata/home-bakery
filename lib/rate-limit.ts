import "server-only";

// Límite de intentos fallidos de login por IP: 5 cada 15 minutos (ventana
// fija). Se suma al rate limit de Supabase Auth (docs/seguridad.md), que
// cuenta por proyecto y por IP del servidor, no por la de quien ingresa.
//
// TODO(Redis): vive en la memoria de cada instancia. En Vercel cada
// instancia tiene su propio Map y se reinicia en cada cold start, así que el
// límite real puede ser mayor. Para un límite compartido, pasarlo a Redis
// (por ejemplo, Upstash con @upstash/ratelimit) con la misma interfaz.

export const loginLimit = { max: 5, windowMs: 15 * 60 * 1000 };

type Entry = { count: number; resetAt: number };
const attempts = new Map<string, Entry>();

/** Si la IP está bloqueada, cuántos minutos faltan; si no, null. */
export function blockedMinutes(key: string, now = Date.now()) {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) return null;
  return entry.count >= loginLimit.max ? Math.ceil((entry.resetAt - now) / 60_000) : null;
}

/** Suma un intento fallido. */
export function registerFailure(key: string, now = Date.now()) {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + loginLimit.windowMs });
  } else {
    entry.count += 1;
  }
  // Que el Map no crezca sin límite: se limpian las ventanas vencidas.
  if (attempts.size > 10_000) {
    for (const [k, e] of attempts) if (e.resetAt <= now) attempts.delete(k);
  }
}

/** Un login correcto borra los intentos de esa IP. */
export function clearFailures(key: string) {
  attempts.delete(key);
}

/**
 * IP de quien hace el pedido. En Vercel, x-forwarded-for la pone la
 * plataforma (el primer valor es la IP real); fuera de un proxy confiable
 * este header se puede falsificar.
 */
export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "desconocida";
}
