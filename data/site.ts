// Única fuente de contenido del sitio: datos del negocio, textos de cada
// página y etiquetas de la interfaz. Los componentes no tienen textos
// escritos adentro; todo lo que se lee en pantalla sale de acá.

/* -------------------------------------------------------------------------- */
/* Negocio                                                                    */
/* -------------------------------------------------------------------------- */

const whatsappNumber = "5491155767591";

export const site = {
  name: "Home Bakery",
  tagline: "Artesanal, delicado y casero",
  description:
    "Pastelería artesanal en San Isidro: tortas, budines y cookies por encargo, y workshops para aprender a hacerlos en casa.",
  city: "San Isidro",
  keywords: ["pastelería artesanal", "San Isidro", "tortas", "budines", "cookies", "workshops de pastelería"],
  logo: {
    white: { src: "/brand/homebakery_logo_white.png", width: 3003, height: 2835 },
  },
  owner: {
    name: "Maggie",
    role: "Pastelera y fundadora",
    bio: [
      "Aprendí a hornear en la cocina de mi abuela, midiendo la harina a ojo y esperando que el budín se enfriara para cortarlo.",
      "Después de años horneando para amigos y familia, en 2023 nació Home Bakery: una pastelería chiquita, con recetas propias, ingredientes de estación y cero apuro.",
      "Hoy también doy workshops para que más personas se animen a hornear en casa.",
    ],
  },
  leadTime: "Pedidos con 48 h de anticipación",
  pickup: "Take away en San Isidro",
  hours: [
    { days: "Lun a Vie", time: "10 a 19 h" },
    { days: "Sáb", time: "9 a 13 h" },
  ],
  contact: {
    whatsapp: {
      label: "WhatsApp",
      display: "11 5576-7591",
      url: `https://wa.me/${whatsappNumber}`,
    },
    instagram: {
      label: "Instagram",
      display: "@homebakery.pasteleria",
      url: "https://www.instagram.com/homebakery.pasteleria/",
    },
  },
} as const;

/** Link a WhatsApp, opcionalmente con un mensaje precargado. */
export function whatsappLink(message?: string) {
  const { url } = site.contact.whatsapp;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

export const whatsappMessages = {
  general: "¡Hola! Quería hacer una consulta.",
  order: "¡Hola! Quería hacer un pedido.",
  product: (name: string) => `¡Hola! Quería encargar: ${name}.`,
  workshop: (title: string) => `¡Hola! Quería anotarme al workshop "${title}".`,
};

export const navigation = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/workshops", label: "Workshops" },
  { href: "/maggie", label: "Maggie" },
] as const;

/** Avisos de la barra superior. */
export const announcements = [
  site.leadTime,
  site.pickup,
  ...site.hours.map((slot) => `${slot.days} ${slot.time}`),
];

/* -------------------------------------------------------------------------- */
/* Etiquetas de la interfaz                                                   */
/* -------------------------------------------------------------------------- */

export const ui = {
  skipLink: "Saltar al contenido",
  homeLink: `${site.name}, ir al inicio`,
  announcementsLabel: "Avisos",
  mainNavLabel: "Principal",
  menuButton: "Menú",
  // Todavía no hay carrito: el ícono lleva a la tienda hasta que exista.
  cart: { label: "Carrito", href: "/tienda" },
  imagePending: "Foto próximamente",
  whatsappFloat: {
    text: "¿Consultas? Escribinos",
    // Incluye el texto visible para cumplir "etiqueta en el nombre" (WCAG 2.5.3).
    label: "¿Consultas? Escribinos por WhatsApp",
  },
  footer: {
    navLabel: "Secundaria",
    navTitle: "Navegación",
    hoursTitle: "Horarios",
    contactTitle: "Contacto",
    copyright: (year: number) => `© ${year} ${site.name}. Hecho a mano en ${site.city}.`,
  },
  product: {
    order: "Encargar",
  },
  workshop: {
    enroll: "Quiero anotarme",
    timeSuffix: "h",
    duration: "Duración",
    level: "Nivel",
    spots: "Cupos",
    spotsUnit: "personas",
    price: "Precio",
  },
};

/* -------------------------------------------------------------------------- */
/* Catálogo                                                                   */
/* -------------------------------------------------------------------------- */

export type ProductCategory = "Tortas" | "Budines" | "Cookies" | "Tartas";

/** Si la foto todavía no está, se omite `src` y se muestra el placeholder. */
export type SiteImage = { src?: string; alt: string };

export type Product = {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  /** Precio en pesos argentinos. */
  price: number;
  /** Porciones o unidades, para mostrar junto al precio. */
  size: string;
  image: SiteImage;
  featured?: boolean;
};

export const productCategories: ProductCategory[] = ["Tortas", "Budines", "Cookies", "Tartas"];

export const products: Product[] = [
  {
    id: "torta-chocolate",
    name: "Torta de chocolate y dulce de leche",
    description:
      "Bizcochuelo húmedo de cacao, relleno de dulce de leche repostero y ganache de chocolate semiamargo.",
    category: "Tortas",
    price: 32000,
    size: "12 porciones",
    image: {
      alt: "Torta de chocolate alta cortada, con capas de dulce de leche y cobertura brillante de ganache",
    },
    featured: true,
  },
  {
    id: "budin-limon",
    name: "Budín de limón y amapolas",
    description:
      "Budín esponjoso con ralladura de limón, semillas de amapola y un glaseado ácido por encima.",
    category: "Budines",
    price: 9500,
    size: "1 unidad (500 g)",
    image: {
      alt: "Budín de limón con semillas de amapola y glaseado blanco chorreado por los costados",
    },
    featured: true,
  },
  {
    id: "cookies-chips",
    name: "Cookies con chips de chocolate",
    description:
      "Cookies bien doradas por fuera y blandas por dentro, con chips de chocolate y un toque de sal.",
    category: "Cookies",
    price: 12000,
    size: "Caja x 6",
    image: {
      alt: "Seis cookies doradas con chips de chocolate apiladas en una caja de cartón",
    },
    featured: true,
  },
  {
    id: "carrot-cake",
    name: "Carrot cake",
    description:
      "Torta de zanahoria con nueces y especias, rellena y cubierta con frosting de queso crema.",
    category: "Tortas",
    price: 30000,
    size: "10 porciones",
    image: {
      alt: "Carrot cake de dos pisos cubierta con frosting blanco y nueces picadas",
    },
  },
  {
    id: "tarta-frutillas",
    name: "Tarta de frutillas",
    description: "Masa sablée, crema pastelera de vainilla y frutillas frescas de estación.",
    category: "Tartas",
    price: 26000,
    size: "8 porciones",
    image: {
      alt: "Tarta redonda cubierta de frutillas frescas cortadas a la mitad sobre crema pastelera",
    },
  },
  {
    id: "budin-banana",
    name: "Budín de banana y nueces",
    description: "Hecho con bananas bien maduras, nueces tostadas y azúcar mascabo.",
    category: "Budines",
    price: 9000,
    size: "1 unidad (500 g)",
    image: {
      alt: "Budín de banana cortado en rodajas, con nueces a la vista en el interior",
    },
  },
];

export const featuredProducts = products.filter((product) => product.featured);

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
  image: SiteImage;
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
      alt: "Torta de capas sobre un plato giratorio mientras se alisa la cobertura con una espátula",
    },
  },
];

/** Workshops ordenados por fecha, del más próximo al más lejano. */
export const upcomingWorkshops = [...workshops].sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
);

/* -------------------------------------------------------------------------- */
/* Páginas                                                                    */
/* -------------------------------------------------------------------------- */

const ownerImage: SiteImage = {
  alt: `${site.owner.name}, fundadora de ${site.name}, sonriendo en su cocina con un delantal y un bowl de masa`,
};

const heroImage: SiteImage = {
  alt: "Mesa de madera con una torta de chocolate, un budín de limón y cookies recién horneadas",
};

const kitchenImage: SiteImage = {
  alt: "Cocina luminosa con una mesada de madera, frascos de harina y azúcar y un horno encendido",
};

export const pages = {
  layout: {
    title: `${site.name} · Pastelería artesanal en ${site.city}`,
  },
  home: {
    hero: {
      eyebrow: `Pastelería artesanal en ${site.city}`,
      title: "Dulces caseros hechos con amor",
      script: "amor",
      text: "Tortas, budines y cookies por encargo, horneados en pocas cantidades y con ingredientes de verdad.",
      primaryCta: { label: "Ver la tienda", href: "/tienda" },
      secondaryCta: { label: "Próximos workshops", href: "/workshops" },
      image: heroImage,
    },
    featured: {
      eyebrow: "Lo más pedido",
      title: "Nuestros favoritos",
      script: "favoritos",
      intro: "Recetas propias, horneadas por encargo con ingredientes frescos.",
      cta: { label: "Ver toda la tienda", href: "/tienda" },
    },
    workshops: {
      eyebrow: "Aprendé a hornear",
      title: "Horneá con nosotras",
      script: "nosotras",
      intro: "Grupos reducidos, todo el material incluido y te llevás lo que horneás.",
      cta: { label: "Ver todos los workshops", href: "/workshops" },
    },
    about: {
      eyebrow: "Detrás del horno",
      title: `Hola, soy ${site.owner.name}`,
      script: site.owner.name,
      cta: { label: "Conocé mi historia", href: "/maggie" },
      image: ownerImage,
    },
    order: {
      eyebrow: site.leadTime,
      title: "¿Tenés un cumple o simplemente ganas de algo rico?",
      script: "rico",
      text: "Escribinos con al menos 48 horas de anticipación y armamos tu pedido.",
      cta: { label: "Pedir por WhatsApp", href: whatsappLink(whatsappMessages.order) },
    },
  },
  tienda: {
    metadata: {
      title: "Tienda",
      description: "Tortas, budines, cookies y tartas artesanales por encargo en San Isidro.",
    },
    eyebrow: "Por encargo",
    title: "Nuestra tienda",
    script: "tienda",
    intro: `Todo se hornea el día anterior a la entrega. ${site.leadTime}. ${site.pickup}.`,
  },
  workshops: {
    metadata: {
      title: "Workshops",
      description: "Workshops de pastelería artesanal en grupos reducidos, para todos los niveles.",
    },
    eyebrow: "Aprendé a hornear",
    title: "Nuestros workshops",
    script: "workshops",
    intro: "Encuentros en grupos chicos para aprender técnicas de pastelería casera, paso a paso y sin apuro.",
    upcoming: { title: "Próximas fechas" },
    howItWorks: {
      title: "¿Cómo funcionan?",
      steps: [
        {
          title: "Elegí tu workshop",
          text: "Mirá las fechas y elegí el que más te guste. Si es tu primera vez, empezá por uno de nivel inicial.",
        },
        {
          title: "Reservá tu lugar",
          text: "Escribinos por WhatsApp. El lugar se confirma con una seña del 50 %.",
        },
        {
          title: "Vení con ganas",
          text: "Los ingredientes, los utensilios y el delantal los ponemos nosotras. Vos te llevás lo que horneás y las recetas.",
        },
      ],
    },
  },
  maggie: {
    metadata: {
      title: site.owner.name,
      description: `La historia de ${site.name} y de ${site.owner.name}, la pastelera detrás de cada receta.`,
    },
    eyebrow: "Nuestra historia",
    title: `Conocé a ${site.owner.name}`,
    script: site.owner.name,
    intro: site.tagline,
    story: {
      title: "Cómo empezó todo",
      script: "todo",
      image: ownerImage,
    },
    values: {
      title: "Lo que nos importa",
      items: [
        {
          title: "Ingredientes de verdad",
          text: "Manteca, huevos de campo y frutas de estación. Sin premezclas ni conservantes.",
        },
        {
          title: "Tiempo y paciencia",
          text: "Cada pedido se hornea en pocas cantidades, para que salga como tiene que salir.",
        },
        {
          title: "Recetas compartidas",
          text: "Nada de secretos: en los workshops enseño las mismas recetas que vendo.",
        },
      ],
    },
    kitchen: {
      title: "La cocina",
      caption: `Todo se hornea en una cocina habilitada, en ${site.city}.`,
      image: kitchenImage,
      cta: { label: "Escribime por WhatsApp", href: whatsappLink(whatsappMessages.general) },
    },
  },
};
