import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import { admin } from "@/data/admin";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = admin.login.metadata;

export default async function IngresarPage({ searchParams }: PageProps<"/admin/ingresar">) {
  const { next } = await searchParams;
  return <LoginForm next={safeNext(next)} />;
}
