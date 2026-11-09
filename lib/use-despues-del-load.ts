"use client";

import { useEffect, useState } from "react";

/**
 * Si ya pasó el evento load. Sirve para pedir fotos que no son el LCP
 * después de la principal: el lazy loading no alcanza cuando están en la
 * pantalla (apiladas) o a menos de ~2500 px, el margen de Chrome en redes lentas.
 */
export function useDespuesDelLoad() {
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    const cargar = () => setCargado(true);
    if (document.readyState === "complete") {
      cargar();
      return;
    }
    window.addEventListener("load", cargar, { once: true });
    return () => window.removeEventListener("load", cargar);
  }, []);

  return cargado;
}
