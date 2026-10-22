"use client";

import { useId, useRef, useState, useTransition } from "react";
import { guardarPrecio } from "@/app/admin/(panel)/productos/actions";
import { Icono } from "@/components/admin/ui/Icono";
import { admin } from "@/data/admin";
import { precioParaInput } from "@/lib/precio";

const content = admin.productos;

type Estado = { tipo: "idle" } | { tipo: "guardando" } | { tipo: "guardado" } | { tipo: "error"; mensaje: string };

/**
 * Precio de un tamaño editable en la lista. Se guarda con Enter o al salir
 * del campo (solo si cambió). El resultado se anuncia en una región
 * aria-live al lado del campo.
 */
export function PrecioEnLinea({ sizeId, price, label }: { sizeId: string; price: number | null; label: string }) {
  const [guardado, setGuardado] = useState(precioParaInput(price));
  const [estado, setEstado] = useState<Estado>({ tipo: "idle" });
  const [, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const id = useId();

  function guardar() {
    const valor = input.current?.value.trim() ?? "";
    if (valor === guardado) return;
    setEstado({ tipo: "guardando" });
    startTransition(async () => {
      const resultado = await guardarPrecio(sizeId, valor);
      if (resultado.ok) {
        const nuevo = precioParaInput(resultado.data.price);
        setGuardado(nuevo);
        if (input.current) input.current.value = nuevo;
        setEstado({ tipo: "guardado" });
      } else {
        setEstado({ tipo: "error", mensaje: resultado.message });
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span aria-hidden="true">$</span>
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          ref={input}
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={guardado}
          placeholder={content.pricePlaceholder}
          aria-invalid={estado.tipo === "error" || undefined}
          aria-describedby={`${id}-estado`}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              guardar();
            }
            if (event.key === "Escape" && input.current) input.current.value = guardado;
          }}
          onBlur={guardar}
          className="h-11 w-28 rounded-lg border border-borde-control bg-white px-2.5 text-15 aria-invalid:border-2 aria-invalid:border-error"
        />
      </div>
      <span id={`${id}-estado`} aria-live="polite" className="min-h-4.5 text-13">
        {estado.tipo === "guardando" && <span className="text-secundario">{admin.ui.saving}</span>}
        {estado.tipo === "guardado" && (
          <span className="inline-flex items-center gap-1 font-medium text-abierto">
            <Icono nombre="check" size={14} />
            {admin.ui.saved}
          </span>
        )}
        {estado.tipo === "error" && <span className="font-medium text-error">{estado.mensaje}</span>}
      </span>
    </div>
  );
}
