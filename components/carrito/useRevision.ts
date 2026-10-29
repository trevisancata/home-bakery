"use client";

import { useEffect, useRef, useState } from "react";
import { useCarrito } from "@/components/carrito/CarritoProvider";
import { claveLinea, type Linea } from "@/lib/carrito/lineas";
import type { Product } from "@/lib/data";

// Revisa el carrito contra el catálogo actual (GET /api/v1/productos) al
// abrir /carrito y el checkout: avisa si un producto dejó de estar
// disponible o cambió de precio, y actualiza el precio guardado. Es solo
// para avisar a tiempo: el precio que se cobra lo calcula siempre la base.

export type EstadoLinea = { tipo: "ok" } | { tipo: "no_disponible" } | { tipo: "precio"; antes: number; ahora: number };

export type Revision =
  | { estado: "revisando" }
  | { estado: "error" }
  | { estado: "lista"; lineas: Record<string, EstadoLinea> };

function revisar(linea: Linea, productos: Map<string, Product>): EstadoLinea {
  const producto = productos.get(linea.productId);
  const tamano = producto?.sizes.find((size) => size.id === linea.sizeId);
  if (!producto || !tamano || tamano.price === null || producto.custom || !producto.inSeason) return { tipo: "no_disponible" };
  if (linea.flavor && !producto.flavors.includes(linea.flavor)) return { tipo: "no_disponible" };
  if (!linea.flavor && producto.flavors.length > 0) return { tipo: "no_disponible" };
  if (linea.decoration && !producto.decorations.includes(linea.decoration)) return { tipo: "no_disponible" };
  return tamano.price === linea.unitPrice ? { tipo: "ok" } : { tipo: "precio", antes: linea.unitPrice, ahora: tamano.price };
}

export function useRevision(): Revision {
  const { lines, ready, update } = useCarrito();
  const [revision, setRevision] = useState<Revision>({ estado: "revisando" });
  // Se revisa una vez por visita, cuando ya se leyó el carrito. Es un ref
  // (no estado): update() cambia las líneas y no tiene que volver a revisar.
  const revisado = useRef(false);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || revisado.current || lines.length === 0) return;
    revisado.current = true;
    (async () => {
      try {
        const response = await fetch("/api/v1/productos", { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const { data } = (await response.json()) as { data: Product[] };
        if (!montado.current) return;
        const productos = new Map(data.map((producto) => [producto.id, producto]));
        const lineas: Record<string, EstadoLinea> = {};
        for (const linea of lines) lineas[claveLinea(linea)] = revisar(linea, productos);
        // Precio y anticipación actualizados en lo guardado (el aviso queda en
        // pantalla). Sobre el carrito de ahora: si mientras tanto cambió, manda ese.
        update((actuales) =>
          actuales.map((linea) => {
            const estado = lineas[claveLinea(linea)] ?? revisar(linea, productos);
            const producto = productos.get(linea.productId);
            if (estado.tipo === "no_disponible" || !producto) return linea;
            return {
              ...linea,
              unitPrice: estado.tipo === "precio" ? estado.ahora : linea.unitPrice,
              leadTimeHours: producto.leadTimeHours,
            };
          }),
        );
        setRevision({ estado: "lista", lineas });
      } catch {
        if (montado.current) setRevision({ estado: "error" });
      }
    })();
  }, [ready, lines, update]);

  return revision;
}

/** Si la línea está disponible (mientras se revisa, o si no se pudo revisar, se asume que sí). */
export function disponible(revision: Revision, linea: Linea) {
  return revision.estado !== "lista" || revision.lineas[claveLinea(linea)]?.tipo !== "no_disponible";
}
