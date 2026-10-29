"use client";

import { pedidos } from "@/data/site";

type Props = {
  value: number;
  onChange: (value: number) => void;
  /** Id del texto que nombra el grupo (aria-labelledby). */
  labelledBy: string;
  lessLabel: string;
  moreLabel: string;
  /** Lo que lee el lector de pantalla en vez del número solo. */
  valueText: string;
  disabled?: boolean;
};

/** − número +, como el selector de lugares de la inscripción. De 1 a pedidos.maxCantidad. */
export function Cantidad({ value, onChange, labelledBy, lessLabel, moreLabel, valueText, disabled }: Props) {
  const boton = "size-11 rounded-full text-18 text-carbon disabled:cursor-not-allowed disabled:text-greige";
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex items-center self-start rounded-full border border-borde-control">
      <button type="button" aria-label={lessLabel} disabled={disabled || value <= 1} onClick={() => onChange(value - 1)} className={boton}>
        −
      </button>
      <span aria-live="polite" className="w-8 text-center font-semibold">
        <span aria-hidden="true">{value}</span>
        <span className="sr-only">{valueText}</span>
      </span>
      <button
        type="button"
        aria-label={moreLabel}
        disabled={disabled || value >= pedidos.maxCantidad}
        onClick={() => onChange(value + 1)}
        className={boton}
      >
        +
      </button>
    </div>
  );
}
