export type Workshop = {
  id: string;
  title: string;
  description: string;
  /** Fecha y hora de inicio en formato ISO, con zona horaria de Argentina. */
  date: string;
  duration: string;
  /** Precio en pesos argentinos. */
  price: number;
  spots: number;
  level: "Inicial" | "Intermedio";
  image: { src: string; alt: string };
};

export const workshops: Workshop[] = [
  {
    id: "budines-basicos",
    title: "Budines para empezar",
    description:
      "Aprendé la base de un buen budín y tres variantes: limón, banana y marmolado. Te llevás todo lo que horneamos.",
    date: "2026-10-17T10:00:00-03:00",
    duration: "3 horas",
    price: 28000,
    spots: 8,
    level: "Inicial",
    image: {
      src: "/images/workshop-budines.svg",
      alt: "Mesa de trabajo con moldes de budín, harina, huevos y limones listos para hornear",
    },
  },
  {
    id: "cookies-perfectas",
    title: "Cookies perfectas",
    description:
      "Textura, temperatura y tiempos: todo lo que hace falta para lograr cookies crocantes por fuera y blandas por dentro.",
    date: "2026-10-31T16:00:00-03:00",
    duration: "2 horas y media",
    price: 25000,
    spots: 10,
    level: "Inicial",
    image: {
      src: "/images/workshop-cookies.svg",
      alt: "Manos formando bollitos de masa de cookies sobre una placa con papel manteca",
    },
  },
  {
    id: "tortas-decoradas",
    title: "Tortas de capas y decoración",
    description:
      "Armado, relleno y cobertura de una torta de capas con terminación lisa y decoración con manga.",
    date: "2026-11-14T10:00:00-03:00",
    duration: "4 horas",
    price: 38000,
    spots: 6,
    level: "Intermedio",
    image: {
      src: "/images/workshop-tortas.svg",
      alt: "Torta de capas sobre un plato giratorio mientras se alisa la cobertura con una espátula",
    },
  },
];

/** Workshops ordenados por fecha, del más próximo al más lejano. */
export const upcomingWorkshops = [...workshops].sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
);
