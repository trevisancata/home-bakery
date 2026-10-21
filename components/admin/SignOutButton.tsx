import { cerrarSesion } from "@/app/admin/actions";
import { Button } from "@/components/Button";

/** Cerrar sesión es un POST (Server Action), nunca un link: un GET no cambia estado. */
export function SignOutButton({ label, variant = "secondary" }: { label: string; variant?: "primary" | "secondary" }) {
  return (
    <form action={cerrarSesion}>
      <Button type="submit" variant={variant} className="w-full">
        {label}
      </Button>
    </form>
  );
}
