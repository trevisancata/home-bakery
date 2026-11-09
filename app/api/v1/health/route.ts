import { version } from "@/package.json";

// Para el monitoreo (docs/deploy.md): responde rápido y sin tocar la base,
// así un problema de Supabase no se confunde con el sitio caído.

/** GET /api/v1/health → 200 { status: "ok", version, commit } */
export function GET() {
  return Response.json(
    { status: "ok", version, commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
