import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary";

// Mockup: 52 px de alto, 28 px de padding (24 en mobile), DM Sans 600 a 15 px.
const base =
  "inline-flex min-h-13 items-center justify-center gap-2 rounded-full px-6 py-2 text-center text-[0.9375rem] font-semibold no-underline transition-colors sm:px-7";

// El borde del secundario va en carbón (12:1 sobre hueso), no en greige.
const variants: Record<Variant, string> = {
  primary: "bg-chocolate text-hueso hover:bg-carbon",
  secondary: "border-[1.5px] border-carbon text-carbon hover:border-chocolate hover:bg-chocolate hover:text-hueso",
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
