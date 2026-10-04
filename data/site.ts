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
    white: { src: "/brand/homebakery_logo_sin_tagline_white.png", width: 1660, height: 1561 },
    black: { src: "/brand/homebakery_logo_sin_tagline.png", width: 1660, height: 1561 },
  },
  owner: {
    name: "Maggie",
    role: "Pastelera y fundadora",
    /** Bio de Instagram: el único texto en primera persona confirmado por Maggie. */
    instagramBio: [
      "Soy Maggie Gatti.",
      "Artesanal, delicado y casero.",
      "Workshops reducidos en mi cocina.",
      "Take away en San Isidro.",
      "Pedidos con 48 h de anticipación.",
    ],
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
  workshopCancellation: "¡Hola! Quería consultar por la política de cancelación de los workshops.",
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
      // TODO: completar con Maggie. Quedan afuera hasta tener las respuestas:
      // "¿Hace falta experiencia?" y "¿Qué tengo que llevar?".
      items: [
        {
          question: "¿Dónde es?",
          answer: [
            `En la cocina de ${site.owner.name}, en ${site.city}. La dirección exacta llega con la confirmación.`,
          ],
        },
        {
          question: "¿Puedo cancelar o pasar mi lugar a otra persona?",
          // TODO: reemplazar por la política de cancelación cuando Maggie la defina.
          answer: [
            { text: "Escribinos por WhatsApp", href: whatsappLink(whatsappMessages.workshopCancellation) },
            " y te contamos la política de cancelación de cada workshop.",
          ],
        },
      ] satisfies { question: string; answer: RichText }[],
    },
  },
  inscripcion: {
    metadata: (workshop: string) => ({
      title: `Inscripción · ${workshop}`,
      description: `Reservá tu lugar en el workshop "${workshop}", en la cocina de ${site.owner.name} en ${site.city}.`,
    }),
    breadcrumb: {
      label: "Migas de pan",
      parent: { label: "Workshops", href: "/workshops" },
      current: "Inscripción",
    },
    steps: { label: "Pasos de la inscripción", items: ["1 · Tus datos", "2 · Pago", "3 · Confirmado"] },
    title: { form: "Inscribite al workshop", pay: "Revisá y pagá" },
    form: {
      requiredNote: "Los campos con * son obligatorios.",
      aboutYou: "Tus datos",
      name: "Nombre y apellido",
      whatsapp: "WhatsApp",
      whatsappPlaceholder: "11 ...",
      email: "Email",
      // TODO: el mockup dice "Te mandamos ahí la dirección y los detalles del
      // workshop." Queda afuera hasta que se manden emails (E5) y Maggie lo confirme.
      experience: "¿Cuánta experiencia tenés en pastelería?",
      allergies: "Alergias o restricciones alimentarias",
      allergiesPlaceholder: "Ej.: celiaquía, frutos secos…",
      referral: `¿Cómo conociste ${site.name}?`,
      referralPlaceholder: "Elegí una opción",
      // TODO: apuntar a la política de cancelación cuando Maggie la defina. Por ahora, a la FAQ.
      policy: [
        "Leí la ",
        { text: "política de cancelación", href: "/workshops#preguntas-frecuentes" },
        " del workshop.",
      ] satisfies RichText,
      submit: "Continuar al pago",
      sending: "Enviando…",
      retry: "Reintentar",
      networkError: "No pudimos enviar la inscripción. Revisá tu conexión y probá de nuevo.",
      serverError: "No pudimos guardar la inscripción. Probá de nuevo.",
    },
    summary: {
      label: "Resumen del workshop",
      eyebrow: (month: string) => `Workshop · ${month}`,
      details: { date: "Fecha", time: "Horario", place: "Lugar", price: "Precio por persona" },
      place: `Cocina de ${site.owner.name} · ${site.city}`,
      spots: "Lugares",
      spotsLeft: (spots: number) => `Quedan ${spots}`,
      spotsCount: (spots: number) => (spots === 1 ? "1 lugar" : `${spots} lugares`),
      less: "Un lugar menos",
      more: "Un lugar más",
      total: "Total",
      totalTbd: "A confirmar",
    },
    pay: {
      reviewTitle: "Tus datos",
      experience: (level: string) => `Experiencia: ${level}`,
      spots: (spots: number) => (spots === 1 ? "1 lugar" : `${spots} lugares`),
      whatsapp: {
        text: `Para confirmar tu lugar, mandale este mensaje a ${site.owner.name} por WhatsApp.`,
        messageLabel: "Mensaje",
        cta: "Enviar por WhatsApp",
      },
      mercadoPago: "Pagar con Mercado Pago",
      soon: "Muy pronto",
      // TODO: el mockup dice "Tu lugar queda confirmado cuando se acredita el pago.
      // Si el cupo se completa antes, no se cobra nada." Confirmar con Maggie antes de publicarlo.
      note: "El pago online va a estar disponible muy pronto.",
    },
    soldOut: {
      title: "No quedan lugares",
      text: "Este workshop ya está completo. Escribinos por WhatsApp si querés que te tengamos en cuenta si se libera un lugar.",
      cta: "Avisarme si se libera",
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
      // TODO: completar con Maggie la presentación en primera persona. Por ahora, solo su bio de Instagram.
      text: site.owner.instagramBio.join(" "),
      portrait: ownerImage,
      detail: handsImage,
    },
    // TODO: completar con Maggie. Por ahora, cada valor lleva un dato de su bio de Instagram.
    values: [
      { title: "Artesanal", text: site.leadTime + "." },
      { title: "Delicado", text: site.pickup + "." },
      { title: "Casero", text: site.owner.instagramBio[2] },
    ],
    timeline: {
      title: "De la cocina de casa a tu mesa",
      // TODO: completar con Maggie los años de cada etapa (solo la web, 2026, está confirmada).
      items: [
        { stage: "Family & friends", text: "Las primeras tortas, para cumpleaños de la familia." },
        { stage: "Boca a boca", text: "Los pedidos empiezan a llegar por recomendación." },
        { stage: "Workshops", text: "La cocina se abre para enseñar, una vez por mes." },
        { stage: "Web 2026", text: "Pedidos y reservas desde la web." },
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
  notFound: {
    metadata: { title: "Página no encontrada" },
    eyebrow: "Error 404",
    title: "Esta página se quedó en el horno.",
    script: "horno",
    text: "El link está roto o la página ya no existe. Desde el inicio encontrás la tienda, los workshops y todo lo demás.",
    cta: { label: "Volver al inicio", href: "/" },
  },
};
