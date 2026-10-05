import { requireEnv } from "./env";

export type Bucket = "productos" | "workshops";

/** URL pública de un archivo de Storage (los buckets son públicos). */
export function publicUrl(bucket: Bucket, path: string) {
  const base = requireEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}
