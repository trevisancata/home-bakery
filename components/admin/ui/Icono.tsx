// Íconos del panel (trazos de docs/mockup/admin-*.html). Siempre
// decorativos: el texto o el aria-label del control dice qué hacen.

const paths = {
  inicio: <path d="M4 11l8-7 8 7v9h-5v-6h-6v6H4z" />,
  pedidos: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  productos: (
    <>
      <path d="M4 8l8-4 8 4v8l-8 4-8-4z" />
      <path d="M4 8l8 4 8-4M12 12v8" />
    </>
  ),
  workshops: (
    <>
      <path d="M4 20h16v-7H4z" />
      <path d="M4 15c2 1.5 4 1.5 6 0s4-1.5 6 0 3 1.5 4 0M12 13V9" />
    </>
  ),
  inscripciones: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 010 7M18 14c2 .8 3 2.8 3 6" />
    </>
  ),
  web: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  mas: <path d="M12 5v14M5 12h14" />,
  editar: <path d="M4 20h4L19 9l-4-4L4 16z" />,
  estrella: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" />,
  arriba: <path d="M12 19V5M6 11l6-6 6 6" />,
  abajo: <path d="M12 5v14M6 13l6 6 6-6" />,
  borrar: <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />,
  cerrar: <path d="M6 6l12 12M18 6L6 18" />,
  volver: <path d="M15 5l-7 7 7 7" />,
  buscar: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  subir: <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />,
  whatsapp: (
    <path d="M4 20l1.3-4A8 8 0 1112 20a8 8 0 01-3.9-1z M9 9c0 3 2.5 6 6 6l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z" />
  ),
  usuaria: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </>
  ),
  check: <path d="M5 12l5 5 9-10" />,
} as const;

export type NombreIcono = keyof typeof paths;

export function Icono({ nombre, size = 20, relleno = false, className = "" }: { nombre: NombreIcono; size?: number; relleno?: boolean; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={relleno ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {paths[nombre]}
    </svg>
  );
}
