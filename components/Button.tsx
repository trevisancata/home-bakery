import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "light";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-center font-semibold no-underline transition-colors";

// Mockup: 52 px de alto, 28 px de padding (24 en mobile), 15 px. El chico
// (tienda): 44 px de alto, 20 px de padding, 14 px.
const sizes: Record<Size, string> = {
  md: "min-h-13 px-6 py-2 text-15 lg:px-7",
  sm: "min-h-11 px-5 py-1.5 text-14",
};

// El borde del secundario va en carbón (12:1 sobre hueso), no en greige.
// Deshabilitado, el secundario pasa a secundario (5.96:1): se lee, pero
// se distingue de uno activo.
const variants: Record<Variant, string> = {
  primary: "bg-chocolate text-hueso hover:bg-carbon",
  secondary:
    "border-trazo border-carbon text-carbon not-disabled:hover:border-chocolate not-disabled:hover:bg-chocolate not-disabled:hover:text-hueso disabled:cursor-not-allowed disabled:border-secundario disabled:text-secundario",
  light: "bg-hueso text-carbon hover:bg-crema",
};

type ButtonProps = { variant?: Variant; size?: Size; className?: string } & (
  | ({ href: string } & Omit<ComponentProps<typeof Link>, "href">)
  | ({ href?: undefined } & ComponentProps<"button">)
);

/** Botón con estilos del sistema. Con `href` se renderiza como link. */
export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  const classes = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  if (props.href !== undefined) {
    return <Link {...props} className={classes} />;
  }

  const { type = "button", ...rest } = props;
  return <button type={type} {...rest} className={classes} />;
}
