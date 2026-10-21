"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Cada 5 segundos, hasta 1 minuto. */
export const refresco = { intervaloMs: 5000, intentos: 12 };

/**
 * Mientras el pago está pendiente, vuelve a pedir la página al servidor
 * (que concilia con Mercado Pago). Si en un minuto no se confirmó, deja de
 * preguntar y muestra el aviso.
 */
export function RefrescoPendiente({ aviso }: { aviso: string }) {
  const router = useRouter();
  const [intentos, setIntentos] = useState(0);
  const agotado = intentos >= refresco.intentos;

  useEffect(() => {
    if (agotado) return;
    const timer = setTimeout(() => {
      router.refresh();
      setIntentos((n) => n + 1);
    }, refresco.intervaloMs);
    return () => clearTimeout(timer);
  }, [intentos, agotado, router]);

  return agotado ? <p className="leading-parrafo">{aviso}</p> : null;
}
