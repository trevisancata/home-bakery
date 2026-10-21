import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // forbidden() responde 403 en /admin cuando la cuenta no tiene rol (app/forbidden.tsx).
    authInterrupts: true,
  },
  images: {
    // Fotos del catálogo y de los workshops en Supabase Storage (buckets públicos).
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  // Rutas renombradas: el sitio ya estaba publicado, así que los links viejos
  // redirigen de forma permanente (308) en lugar de dar 404.
  async redirects() {
    return [
      { source: "/productos", destination: "/tienda", permanent: true },
      { source: "/nosotros", destination: "/maggie", permanent: true },
      // El contacto ahora vive en el footer y en el botón de WhatsApp.
      { source: "/contacto", destination: "/", permanent: true },
      // La API pasó a /api/v1 (E5). 308 conserva el método: un POST viejo a
      // /api/inscripciones sigue siendo un POST.
      ...["categorias", "productos", "productos/:slug", "workshops", "inscripciones"].map((path) => ({
        source: `/api/${path}`,
        destination: `/api/v1/${path}`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
