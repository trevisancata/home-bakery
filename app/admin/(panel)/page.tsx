import { SignOutButton } from "@/components/admin/SignOutButton";
import { admin } from "@/data/admin";
import { requireAdminPage } from "@/lib/auth";

const content = admin.home;

export default async function AdminPage() {
  const session = await requireAdminPage("/admin");
  return (
    <main id="contenido" className="contenedor flex flex-col items-start gap-5 py-16 lg:py-24">
      <h1 className="text-40 lg:text-56">{content.title}</h1>
      {session.email && <p className="text-secundario">{content.signedInAs(session.email)}</p>}
      <p className="max-w-150 leading-parrafo">{content.text}</p>
      <SignOutButton label={content.signOut} />
    </main>
  );
}
