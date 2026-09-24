import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "outline";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5 font-semibold no-underline transition-colors";

const variants: Record<Variant, string> = {
  primary: "bg-cacao text-crema hover:bg-cacao-suave",
  secondary: "bg-terracota text-white hover:bg-cacao",
  outline:
    "border-2 border-cacao text-cacao hover:bg-cacao hover:text-crema",
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
