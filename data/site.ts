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
  closed: { days: "Dom", time: "cerrado" },
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
  event: "¡Hola! Quería pedir presupuesto para un evento.",
  product: (name: string) => `¡Hola! Quería encargar: ${name}.`,
  workshop: (title: string) => `¡Hola! Quería anotarme al workshop "${title}".`,
  customWorkshop: "¡Hola! Quería consultar por un workshop personalizado.",
  workshopWaitlist: (title: string) => `¡Hola! Avisame si se libera un lugar en el workshop "${title}".`,
};

export const navigation = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/workshops", label: "Workshops" },
  { href: "/maggie", label: "Maggie" },
] as const;

/** Avisos de la barra superior: completos en desktop, resumidos en mobile. */
export const announcements = {
  full: [site.leadTime, site.pickup, ...site.hours.map((slot) => `${slot.days} ${slot.time}`)],
  short: ["48 h de anticipación", `Take away ${site.city}`],
};

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
  priceTbd: "Precio a confirmar",
  whatsappFloat: {
    label: "Escribinos por WhatsApp",
  },
  footer: {
    navLabel: "Secundaria",
    navTitle: "Inicio",
    links: [
      { href: "/tienda", label: "Tienda" },
      { href: "/workshops", label: "Workshops" },
      { href: "/maggie", label: "Maggie" },
    ],
    hoursTitle: "Retiros",
    hoursItem: (slot: { days: string; time: string }) => `${slot.days} · ${slot.time}`,
    contactTitle: "Contacto",
    copyright: (year: number) => `© ${year} ${site.name}`,
  },
  product: {
    order: "Encargar",
  },
};

/** Si la foto todavía no está, se omite `src` y se muestra el placeholder. */
export type SiteImage = { src?: string; alt: string };

/** Texto con partes en negrita o con links, para no escribir HTML en los datos. */
export type RichText = (string | { strong: string } | { text: string; href: string })[];

/** Envío a domicilio: solo en pedidos grandes y cerca. */
const delivery = {
  minimum: "$400.000",
  radius: "10 km",
};

/* -------------------------------------------------------------------------- */
/* Páginas                                                                    */
/* -------------------------------------------------------------------------- */

const ownerImage: SiteImage = {
  alt: `${site.owner.name}, fundadora de ${site.name}, sonriendo en su cocina con un delantal y un bowl de masa`,
};

const heroImage: SiteImage = {
  alt: "Mesa de madera con una torta de chocolate, un budín de limón y cookies recién horneadas",
};

const handsImage: SiteImage = {
  alt: "Manos amasando sobre una mesada enharinada",
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
      eyebrow: `Pastelería y workshops · ${site.city}`,
      title: "Artesanal, delicado y casero.",
      script: "casero",
      text: {
        full: `Tortas, tartas, cookies y mesas dulces por encargo, hechas por ${site.owner.name} en su cocina de ${site.city}. Encargá online, ${site.owner.name} lo confirma y pasás a retirar.`,
        short: `Tortas, tartas, cookies y mesas dulces por encargo, hechas por ${site.owner.name} en su cocina de ${site.city}.`,
      },
      primaryCta: { label: "Ver la tienda", href: "/tienda" },
      secondaryCta: { label: "Próximo workshop", href: "/workshops" },
      image: heroImage,
      nextWorkshop: {
        eyebrow: "Próximo workshop",
        spotsLeft: (spots: number) => (spots === 1 ? "Queda 1 lugar" : `Quedan ${spots} lugares`),
      },
    },
    howToOrder: {
      eyebrow: "Cómo pedir",
      title: "Simple, como en casa",
      intro: "No hay stock: cada pedido se hornea para vos. Por eso te pedimos 48 h de anticipación.",
      steps: [
        {
          title: { full: "Elegí y encargá", short: "Elegí y encargá" },
          text: {
            full: ["Armá tu pedido desde la tienda y elegí el día y horario de retiro, con al menos 48 h de anticipación."],
            short: "Con al menos 48 h de anticipación.",
          },
        },
        {
          title: { full: "Confirmamos tu pedido", short: `${site.owner.name} lo confirma` },
          text: {
            full: [`${site.owner.name} revisa que pueda hacerlo para esa fecha y te avisa por WhatsApp y email.`],
            short: "Te avisa por WhatsApp y email.",
          },
        },
        {
          title: { full: "Pagá con Mercado Pago", short: "Pagá online" },
          text: {
            full: ["Con el pedido confirmado te llega el link de pago. Antes no se cobra nada."],
            short: "Te llega el link de Mercado Pago.",
          },
        },
        {
          title: { full: "Retirá", short: "Retirá o recibí" },
          text: {
            full: [`Take away en ${site.city}.`, `Envíos a domicilio únicamente desde ${delivery.minimum}, hasta ${delivery.radius}.`],
            short: `Take away en ${site.city}. Envío desde ${delivery.minimum}, hasta ${delivery.radius}.`,
          },
        },
      ],
    },
    favorites: {
      eyebrow: "La tienda",
      title: { full: "Los favoritos de la casa", short: "Favoritos" },
      cta: { label: "Ver todo", href: "/tienda" },
      detail: (size: string) => `${size} · Por encargo`,
    },
    about: {
      eyebrow: "Quién hornea",
      title: `Hola, soy ${site.owner.name}.`,
      script: site.owner.name,
      lead: {
        full: `Magdalena Gatti para los papeles. ${site.name} empezó cocinando para familia y amigos. Hoy más de 35 mil personas siguen mi cocina, pero casi todo sigue llegando de boca en boca.`,
        short: `${site.name} empezó cocinando para familia y amigos, y creció de recomendación en recomendación.`,
      },
      text: site.owner.bio[0],
      cta: { label: "Conocé mi historia", href: "/maggie" },
      image: ownerImage,
    },
    workshop: {
      eyebrow: "Workshop del mes",
      suffix: `Grupos reducidos, en la cocina de ${site.owner.name} en ${site.city}.`,
      spots: (left: number, capacity: number) => `Quedan ${left} de ${capacity} lugares`,
      cta: "Reservar mi lugar",
    },
    instagram: {
      eyebrow: "Desde la cocina",
      title: "Seguí lo que sale del horno",
      intro: "Recetas, tutoriales y lo que se hornea cada semana.",
      // Placeholders hasta conectar los posts reales: son decorativos.
      posts: Array.from({ length: 6 }, (): SiteImage => ({ alt: "" })),
    },
    pickup: {
      eyebrow: { full: "Retiros", short: `Take away en ${site.city}` },
      title: "Pasá a buscarlo",
      text: `Take away en la casa de ${site.owner.name}, en ${site.city}. La dirección exacta te llega con la confirmación del pedido.`,
      hours: [
        { days: { full: "Lunes a viernes", short: "Lun a Vie" }, time: site.hours[0].time },
        { days: { full: "Sábados", short: "Sábados" }, time: site.hours[1].time },
        { days: { full: "Domingos", short: "Domingos" }, time: "Cerrado", closed: true },
      ],
      farAway: {
        title: "¿Vivís lejos?",
        full: [
          "Podés mandar un Uber o una moto a retirar. En pedidos desde ",
          { strong: delivery.minimum },
          ` hacemos envío a domicilio, hasta ${delivery.radius} en Zona Norte.`,
        ] satisfies RichText,
        short: [
          "¿Vivís lejos? Mandá un Uber o una moto. Envío a domicilio desde ",
          { strong: delivery.minimum },
          `, hasta ${delivery.radius}.`,
        ] satisfies RichText,
      },
    },
  },
  tienda: {
    metadata: {
      title: "Tienda",
      description: "Tortas, tartas, cookies y bocados artesanales por encargo en San Isidro.",
    },
    breadcrumb: { label: "Migas de pan", home: "Inicio" },
    title: "Tienda",
    intro: [
      "Todo se hornea por encargo, no hay stock. Al finalizar elegís el día y horario de retiro. ¿Es para un evento? ",
      { text: "Pedí presupuesto por WhatsApp", href: whatsappLink(whatsappMessages.event) },
      ".",
    ] satisfies RichText,
    facts: [
      { term: "Anticipación", value: "48 h" },
      { term: "Retiro", value: `Lun a Sáb, ${site.city}` },
      { term: "Envío", value: `Desde ${delivery.minimum} · ${delivery.radius}` },
    ],
    filter: { label: "Filtrar por categoría", all: "Todo" },
    sort: {
      label: "Ordenar",
      options: [
        { value: "destacados", label: "Destacados" },
        { value: "menor-precio", label: "Menor precio" },
        { value: "mayor-precio", label: "Mayor precio" },
      ],
    },
    results: (count: number) => (count === 1 ? "1 producto" : `${count} productos`),
    card: {
      detail: (size: string) => `${size} · Por encargo`,
      // Hasta que exista el carrito, el botón queda deshabilitado.
      soon: "Muy pronto",
      soonContext: (name: string) => `: agregar ${name} al pedido`,
    },
  },
  workshops: {
    metadata: {
      title: "Workshops",
      description: `Workshops de pastelería en grupos reducidos, en la cocina de ${site.owner.name} en ${site.city}.`,
    },
    eyebrow: `Aprender en la cocina de ${site.owner.name}`,
    title: "Workshops",
    intro: `Workshops reducidos en mi cocina de ${site.city}, uno por mes. Reservás y pagás online y tu lugar queda confirmado al instante.`,
    featured: {
      badge: (month: string) => `Próximo · ${month}`,
      details: { date: "Fecha", time: "Horario", includes: "Incluye", price: "Precio" },
      spotsLeft: (spots: number) => (spots === 1 ? "Queda 1 lugar" : `Quedan ${spots} lugares`),
      capacity: (capacity: number) => `Cupo: ${capacity}`,
      cta: "Reservar mi lugar",
    },
    upcoming: {
      title: "Próximas fechas",
      status: { open: "Inscripción abierta", last: "Últimos lugares", soldOut: "Agotado" },
      cta: "Reservar",
      waitlist: "Avisarme si se libera",
    },
    past: {
      title: "Así fueron los workshops",
      script: "workshops",
      instagram: { label: "Ver más en Instagram", href: site.contact.instagram.url },
      // Las fotos son decorativas: el nombre va debajo de cada una.
      items: [
        "Mis tortas básicas",
        "Pastelería para el té vol. 2",
        "Diseñá tu number cake",
        "Sin azúcar agregada y sin harinas",
      ].map((name): { name: string; image: SiteImage } => ({ name, image: { alt: "" } })),
    },
    custom: {
      title: "Workshop personalizado",
      text: "Para tu grupo de amigas, un cumpleaños o tu equipo de trabajo. Elegís el tema y la fecha.",
      cta: { label: "Consultar por WhatsApp", href: whatsappLink(whatsappMessages.customWorkshop) },
    },
    faq: {
      title: "Preguntas frecuentes",
      // TODO: revisar con Maggie las respuestas provisorias (todas menos "¿Dónde es?").
      items: [
        {
          question: "¿Hace falta experiencia?",
          answer: "No. Los workshops de nivel inicial están pensados para quien nunca horneó; en los de nivel intermedio conviene tener algo de práctica.",
        },
        {
          question: "¿Qué tengo que llevar?",
          answer: "Solo ganas. Los ingredientes, los utensilios y el delantal los pongo yo, y te llevás lo que horneás y las recetas.",
        },
        {
          question: "¿Dónde es?",
          answer: `En la cocina de ${site.owner.name}, en ${site.city}. La dirección exacta llega con la confirmación.`,
        },
        {
          question: "¿Puedo cancelar o pasar mi lugar a otra persona?",
          answer: "Podés pasarle tu lugar a otra persona avisando por WhatsApp. Si cancelás con al menos 72 h de anticipación, te devolvemos el pago.",
        },
      ],
    },
  },
  maggie: {
    metadata: {
      title: site.owner.name,
      description: `La historia de ${site.name} y de ${site.owner.name}, la pastelera detrás de cada receta.`,
    },
    hero: {
      eyebrow: "Magdalena Gatti · Fundadora",
      title: `Hola, soy ${site.owner.name}.`,
      script: site.owner.name,
      lead: `${site.name} nació en mi cocina, horneando para familia y amigos. Hoy más de 35 mil personas siguen lo que hago, pero casi todo sigue llegando porque alguien le contó a alguien.`,
      // TODO: revisar con Maggie (presentación provisoria armada con su bio).
      text: `${site.owner.bio[0]} Que ${site.name} se recomiende de boca en boca es lo que más me enorgullece: cada pedido llega de alguien que ya probó algo mío.`,
      portrait: ownerImage,
      detail: handsImage,
    },
    // TODO: revisar con Maggie los textos provisorios.
    values: [
      { title: "Artesanal", text: site.owner.bio[1] },
      {
        title: "Delicado",
        text: "Todo se hace por encargo, para que llegue recién hecho. Manteca, huevos de campo y frutas de estación, sin premezclas ni conservantes.",
      },
      {
        title: "Casero",
        text: "Workshops reducidos en mi cocina, para que te lleves las recetas a la tuya. Me encanta ver a alguien sacar su primer budín del horno.",
      },
    ],
    timeline: {
      title: "De la cocina de casa a tu mesa",
      // TODO: confirmar los años con Maggie (solo 2026 es seguro).
      items: [
        { year: "2019", title: "Family & friends", text: "Las primeras tortas, para cumpleaños de la familia." },
        { year: "2023", title: "El boca a boca", text: "Los pedidos empiezan a llegar por recomendación." },
        { year: "2024", title: "Primer workshop", text: "La cocina se abre para enseñar, una vez por mes." },
        { year: "2026", title: `${site.name} online`, text: "Pedidos y reservas desde la web." },
      ],
    },
    gallery: [
      kitchenImage,
      { alt: `${site.owner.name} decorando una torta con manga` },
      { alt: "Mesa servida con tortas, budines y cookies" },
    ] satisfies SiteImage[],
    cta: {
      title: `¿Te recomendaron ${site.name}?`,
      text: "Ahora podés encargar directo desde acá.",
      primary: { label: "Ver la tienda", href: "/tienda" },
      secondary: { label: "Workshops", href: "/workshops" },
    },
  },
};
