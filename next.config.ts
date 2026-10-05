import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
