// Workshops. La forma de cada registro sigue la futura tabla `workshops` de
// Supabase; las páginas lo leen siempre a través de lib/data.ts.

/** Si la foto todavía no está, se omite `src` y se muestra el placeholder. */
export type WorkshopImage = { src?: string; alt: string };

export type Workshop = {
  id: string;
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
  /** Qué incluye el workshop (materiales, merienda…), en una línea. */
  includes: string;
  capacity: number;
  spotsLeft: number;
  images: WorkshopImage[];
  active: boolean;
  /** El destacado es el "workshop del mes" del inicio. */
  featured: boolean;
};

// TODO: completar con Maggie los precios y qué incluye cada workshop.
export const workshops: Workshop[] = [
  {
    id: "budines-para-empezar",
    slug: "budines-para-empezar",
    name: "Budines para empezar",
    summary: "La base de un buen budín y tres variantes.",
    description:
      "Aprendé la base de un buen budín y tres variantes: limón, banana y marmolado. Te llevás todo lo que horneamos.",
    startsAt: "2026-10-17T10:00:00-03:00",
    durationMinutes: 180,
    level: "Inicial",
    price: null,
    includes: "A confirmar",
    capacity: 8,
    spotsLeft: 3,
    images: [{ alt: "Mesa de trabajo con moldes de budín, harina, huevos y limones listos para hornear" }],
    active: true,
    featured: true,
  },
  {
    id: "cookies-perfectas",
    slug: "cookies-perfectas",
    name: "Cookies perfectas",
    summary: "Cookies crocantes por fuera y blandas por dentro.",
    description:
      "Textura, temperatura y tiempos: todo lo que hace falta para lograr cookies crocantes por fuera y blandas por dentro.",
    startsAt: "2026-10-31T16:00:00-03:00",
    durationMinutes: 150,
    level: "Inicial",
    price: null,
    includes: "A confirmar",
    capacity: 10,
    spotsLeft: 6,
    images: [{ alt: "Manos formando bollitos de masa de cookies sobre una placa con papel manteca" }],
    active: true,
    featured: false,
  },
  {
    id: "tortas-de-capas",
    slug: "tortas-de-capas",
    name: "Tortas de capas y decoración",
    summary: "Armado, relleno y cobertura de una torta de capas.",
    description:
      "Armado, relleno y cobertura de una torta de capas con terminación lisa y decoración con manga.",
    startsAt: "2026-11-14T10:00:00-03:00",
    durationMinutes: 240,
    level: "Intermedio",
    price: null,
    includes: "A confirmar",
    capacity: 6,
    spotsLeft: 6,
    images: [{ alt: "Torta de capas sobre un plato giratorio mientras se alisa la cobertura con una espátula" }],
    active: true,
    featured: false,
  },
];
