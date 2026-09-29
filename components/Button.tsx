import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-7 py-3 text-center font-medium no-underline transition-colors";

// El borde del secundario va en chocolate (no greige) para superar 3:1.
const variants: Record<Variant, string> = {
  primary: "bg-chocolate text-hueso hover:bg-carbon",
  secondary: "border-2 border-chocolate text-chocolate hover:bg-chocolate hover:text-hueso",
};

type ButtonProps = { variant?: Variant; className?: string } & (
  | ({ href: string } & Omit<ComponentProps<typeof Link>, "href">)
  | ({ href?: undefined } & ComponentProps<"button">)
);

/** Botón con estilos del sistema. Con `href` se renderiza como link. */
export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (props.href !== undefined) {
    return <Link {...props} className={classes} />;
  }

  const { type = "button", ...rest } = props;
  return <button type={type} {...rest} className={classes} />;
}
