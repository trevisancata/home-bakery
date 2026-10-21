import type { Metadata } from "next";
import { RecoverForm } from "@/components/admin/RecoverForm";
import { admin } from "@/data/admin";

export const metadata: Metadata = admin.recover.metadata;

/** ?error=link: el link del mail venció o ya se usó (lo manda /admin/auth/confirm). */
export default async function RecuperarPage({ searchParams }: PageProps<"/admin/recuperar">) {
  const { error } = await searchParams;
  return <RecoverForm invalidLink={error === "link"} />;
}
