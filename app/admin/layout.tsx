import type { Metadata } from "next";
import { admin } from "@/data/admin";

// El panel no se indexa. Leer la sesión vuelve dinámicas todas las rutas de
// /admin; las públicas no se tocan.
export const metadata: Metadata = {
  title: admin.metadata.title,
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
