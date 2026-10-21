import { AdminSplit } from "@/components/admin/AdminSplit";

export default function AccesoLayout({ children }: { children: React.ReactNode }) {
  return <AdminSplit>{children}</AdminSplit>;
}
