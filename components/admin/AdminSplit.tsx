import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { admin } from "@/data/admin";

/**
 * Pantallas de acceso al panel (login, recuperación, 403): logo sobre
 * chocolate a la izquierda y el contenido a la derecha, como
 * docs/mockup/admin-login.html. En mobile el logo va arriba, más chico.
 */
export function AdminSplit({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] bg-hueso lg:grid-cols-2 lg:grid-rows-1">
      <div
        data-surface="dark"
        className="flex items-center justify-center bg-chocolate px-4 py-8 lg:p-16"
      >
        <Logo alt={admin.brandAlt} className="size-28 lg:size-55" imageClassName="w-[71%]" />
      </div>
      <main id="contenido" className="flex items-center justify-center px-4 py-10 sm:px-6 lg:p-16">
        <div className="flex w-full max-w-105 flex-col gap-5">
          {children}
          <p className="text-center text-13 text-secundario">
            {admin.accessNote[0]}
            <br />
            {admin.accessNote[1]}
          </p>
        </div>
      </main>
    </div>
  );
}
