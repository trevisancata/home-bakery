// Workshops de ejemplo para el seed (npm run seed). La web ya no lee este
// archivo: los workshops salen de Supabase (lib/data.ts). Se cargan con
// es_ejemplo = true, así que se muestran con aviso y no aceptan inscripciones.
// TODO(Maggie): cargar el workshop real (fecha, precio y qué incluye).

export type WorkshopSeed = {
  slug: string;
  name: string;
  /** Qué se aprende, en una línea. */
  summary: string;
  description: string;
  /** Fecha y hora de inicio en formato ISO, con zona horaria de Argentina. */
  startsAt: string;
  durationMinutes: number;
  level: "Inicial" | "Intermedio";
  /** Precio en pesos argentinos; null mientras no esté confirmado. */
  price: number | null;
  capacity: number;
  active: boolean;
  /** El destacado es el "workshop del mes" del inicio. */
  featured: boolean;
};

export const workshops: WorkshopSeed[] = [
  {
    slug: "budines-para-empezar",
    name: "Budines para empezar",
    summary: "La base de un buen budín y tres variantes.",
    description:
      "Aprendé la base de un buen budín y tres variantes: limón, banana y marmolado. Te llevás todo lo que horneamos.",
    startsAt: "2026-10-17T10:00:00-03:00",
    durationMinutes: 120,
    level: "Inicial",
    price: null,
    capacity: 8,
    active: true,
    featured: true,
  },
  {
    slug: "cookies-perfectas",
    name: "Cookies perfectas",
    summary: "Cookies crocantes por fuera y blandas por dentro.",
    description:
      "Textura, temperatura y tiempos: todo lo que hace falta para lograr cookies crocantes por fuera y blandas por dentro.",
    startsAt: "2026-10-31T16:00:00-03:00",
    durationMinutes: 120,
    level: "Inicial",
    price: null,
    capacity: 8,
    active: true,
    featured: false,
  },
  {
    slug: "tortas-de-capas",
    name: "Tortas de capas y decoración",
    summary: "Armado, relleno y cobertura de una torta de capas.",
    description:
      "Armado, relleno y cobertura de una torta de capas con terminación lisa y decoración con manga.",
    startsAt: "2026-11-14T10:00:00-03:00",
    durationMinutes: 120,
    level: "Intermedio",
    price: null,
    capacity: 8,
    active: true,
    featured: false,
  },
];
