import type { ReactNode } from "react";

export function EstadoVacio({ children, accion }: { children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-borde-control bg-white p-6 text-15 text-secundario">
      <p>{children}</p>
      {accion}
    </div>
  );
}
