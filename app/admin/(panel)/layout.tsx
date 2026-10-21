import { requireAdminPage } from "@/lib/auth";

// Sin sesión → login; sin rol → 403. Los layouts no se vuelven a renderizar
// al navegar, así que cada página también llama a requireAdminPage().
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <div className="min-h-dvh bg-hueso">{children}</div>;
}
