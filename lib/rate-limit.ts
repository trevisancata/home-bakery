// Rate limit simple por clave (la IP): ventana fija en memoria.
//
// - Login del panel: 5 intentos fallidos cada 15 minutos (app/admin/actions.ts).
// - Inscripciones: 5 cada 10 minutos (POST /api/v1/inscripciones).
// - Pedidos de la tienda: 5 cada 10 minutos (POST /api/v1/pedidos).
//
// TODO(Redis): vive en la memoria de cada instancia. En Vercel cada
// instancia tiene su propio Map y se reinicia en cada cold start, así que el
// límite real puede ser mayor. Para un límite compartido, pasarlo a Redis
// (por ejemplo, Upstash con @upstash/ratelimit) con la misma interfaz.

type Entry = { count: number; resetAt: number };

export type RateLimiter = {
  readonly max: number;
  readonly windowMs: number;
  /** Si la clave está bloqueada, cuántos minutos faltan; si no, null. */
  blockedMinutes(key: string, now?: number): number | null;
  /** Suma un intento. */
  hit(key: string, now?: number): void;
  /** Borra los intentos de la clave (por ejemplo, después de un login correcto). */
  clear(key: string): void;
};

export function createRateLimiter({ max, windowMs }: { max: number; windowMs: number }): RateLimiter {
  const attempts = new Map<string, Entry>();
  return {
    max,
    windowMs,
    blockedMinutes(key, now = Date.now()) {
      const entry = attempts.get(key);
      if (!entry || entry.resetAt <= now) return null;
      return entry.count >= max ? Math.ceil((entry.resetAt - now) / 60_000) : null;
    },
    hit(key, now = Date.now()) {
      const entry = attempts.get(key);
      if (!entry || entry.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + windowMs });
      else entry.count += 1;
      // Que el Map no crezca sin límite: se limpian las ventanas vencidas.
      if (attempts.size > 10_000) {
        for (const [k, e] of attempts) if (e.resetAt <= now) attempts.delete(k);
      }
    },
    clear(key) {
      attempts.delete(key);
    },
  };
}

/** Intentos fallidos de login del panel. */
export const loginLimiter = createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 });

/**
 * Inscripciones válidas por IP. INSCRIPCIONES_RATE_LIMIT_MAX solo existe para
 * los e2e, que inscriben muchas veces desde la misma IP.
 */
export const inscripcionesLimiter = createRateLimiter({
  max: Number(process.env.INSCRIPCIONES_RATE_LIMIT_MAX) || 5,
  windowMs: 10 * 60 * 1000,
});

/** Pedidos válidos por IP. PEDIDOS_RATE_LIMIT_MAX solo existe para los e2e. */
export const pedidosLimiter = createRateLimiter({
  max: Number(process.env.PEDIDOS_RATE_LIMIT_MAX) || 5,
  windowMs: 10 * 60 * 1000,
});

/**
 * IP de quien hace el pedido. En Vercel, x-forwarded-for la pone la
 * plataforma (el primer valor es la IP real); fuera de un proxy confiable
 * este header se puede falsificar.
 */
export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "desconocida";
}
