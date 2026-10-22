"use client";

/**
 * Interruptor accesible (role="switch"). El área táctil es de 44 px aunque
 * el dibujo sea más chico. Verde (abierto) prendido; apagado, el borde de
 * controles (3:1 sobre blanco y sobre hueso).
 */
export function Switch({
  checked,
  onChange,
  label,
  labelledBy,
  describedBy,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      className="group inline-flex min-h-11 min-w-14 shrink-0 items-center justify-center rounded-full aria-disabled:cursor-wait aria-disabled:opacity-60"
    >
      <span
        className={`flex h-7.5 w-13 items-center rounded-full p-0.75 transition-colors ${
          checked ? "justify-end bg-abierto" : "justify-start bg-borde-control"
        }`}
      >
        <span className="size-6 rounded-full bg-white shadow-sm" />
      </span>
    </button>
  );
}
