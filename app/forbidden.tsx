import type { Metadata } from "next";
import Link from "next/link";
import { AdminSplit } from "@/components/admin/AdminSplit";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { Eyebrow } from "@/components/Eyebrow";
import { admin } from "@/data/admin";

const content = admin.forbidden;

export const metadata: Metadata = content.metadata;

/**
 * 403: hay sesión, pero la cuenta no tiene rol de admin. La muestra
 * forbidden() (lib/auth.ts) con status 403. El mockup no tiene esta
 * pantalla: usa el mismo layout que el login.
 */
export default function Forbidden() {
  return (
    <AdminSplit>
      <div className="flex flex-col gap-3">
        <Eyebrow>{content.eyebrow}</Eyebrow>
        <h1 className="text-40 lg:text-44">{content.title}</h1>
        <p className="leading-parrafo text-secundario">{content.text}</p>
      </div>
      <SignOutButton label={content.signOut} variant="primary" />
      <Link href={content.home.href} className="self-center px-3 py-2.5 text-14 font-semibold text-chocolate hover:text-carbon">
        {content.home.label}
      </Link>
    </AdminSplit>
  );
}
