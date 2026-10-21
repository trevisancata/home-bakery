import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewPasswordForm } from "@/components/admin/NewPasswordForm";
import { admin } from "@/data/admin";
import { getAdminSession } from "@/lib/auth";

export const metadata: Metadata = admin.newPassword.metadata;

/** Se llega desde el link de recuperación, que deja una sesión abierta. */
export default async function NuevaContrasenaPage() {
  const session = await getAdminSession();
  if (session.status === "anonima") redirect("/admin/ingresar");
  return <NewPasswordForm />;
}
