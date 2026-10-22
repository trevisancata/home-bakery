import { PanelNav } from "@/components/admin/panel/PanelNav";
import { admin } from "@/data/admin";
import { requireAdminPage } from "@/lib/auth";

// Sin sesión → login; sin rol → 403. Los layouts no se vuelven a renderizar
// al navegar, así que cada página también llama a requireAdminPage().
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  return (
    <div className="min-h-dvh bg-hueso lg:flex">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-chocolate focus:px-5 focus:py-3 focus:font-medium focus:text-hueso"
      >
        {admin.panel.skip}
      </a>
      <PanelNav nombre={session.nombre} />
      {/* pb: lugar para la barra de abajo en mobile. */}
      <div className="min-w-0 flex-1 pb-28 lg:pb-0">{children}</div>
    </div>
  );
}
