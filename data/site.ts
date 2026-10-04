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
  videoPending: "Video próximamente",
  video: { pause: "Pausar video", play: "Reproducir video" },
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

/**
 * Diapositiva de la portada del inicio: foto o video. Sin `src` se muestra un
 * placeholder de color. Los videos van sin audio y con póster.
 */
export type HeroSlide = { type: "image" | "video"; src?: string; poster?: string; alt: string };

// TODO(Maggie): 3 o 4 fotos o videos horizontales para la portada. Mientras
// tanto, placeholders: las fotos del catálogo son todas verticales.
// Los placeholders son decorativos (alt vacío): no describen fotos que no existen.
export const heroSlides: HeroSlide[] = [
  { type: "image", alt: "" },
  { type: "video", alt: "" },
  { type: "image", alt: "" },
];

/** Envío a domicilio: solo en pedidos grandes y cerca. */
const delivery = {
  minimum: "$400.000",
  radius: "10 km",
};

/* -------------------------------------------------------------------------- */
/* Páginas                                                                    */
/* -------------------------------------------------------------------------- */

const ownerImage = {
  src: "/fotos/maggie-presentacion.jpg",
  alt: `${site.owner.name} apoyada en la mesada de su cocina, sonriendo`,
} satisfies SiteImage;

/**
 * Presentación de Maggie (docs/contenido-maggie.md, 01/10), en sus palabras.
 * Solo se corrigió ortografía: no reescribir sin su OK.
 */
const ownerStory = [
  "Home Bakery nació en mi cocina, horneando siempre para mi familia y amigos.",
  "Soy diseñadora gráfica, dediqué casi 15 años al mundo del diseño y la publicidad. Aprendí mucho y lo disfruté un montón, pero cumplió un ciclo en mi vida.",
  "Y como a muchas mujeres nos pasa, la llegada de los hijos en nuestra vida trae cambios y desestructura un poco. Ya no quería trabajar fuera de casa tanto tiempo, quería estar más cerca de ellos.",
  "Así fue que me animé a cambiar y empezar el camino de la gastronomía, que siempre fue parte de mi vida, siempre cociné como modo de conexión y desconexión a la vez.",
  "Me formé en el IAG como chef profesional y como pastelera en el Ott College. Dediqué mucho tiempo a aprender de grandes referentes. Hice pasantías y me nutrí de quienes tuve cerca para aprender.",
  "Hoy pude conformar una comunidad que le suma a lo que hago, pero casi todo sigue llegando porque alguien le contó a alguien. Y como soy muy inquieta, empecé a organizar workshops de pastelería en mi cocina, para compartirles todo lo que fui aprendiendo en estos 10 años.",
  "Espero verte pronto en mi cocina.",
] as const;

/** Texto de Maggie sobre los workshops (docs/contenido-maggie.md, 01/10). */
const workshopsStory = {
  teaching: [
    "Enseñar pastelería no es solo pasar recetas. Es aprender a leer una masa, a entender por qué algo sale bien o por qué no sale. Es saber cuándo seguir una receta y cuándo no.",
    "Eso no se aprende en un PDF, se aprende mirando, preguntando, probando y equivocándose con alguien al lado. Yo aprendí así. Y así también trabajo.",
  ],
  meeting: "Los workshops son un lugar de encuentro, un momento para frenar, compartir y disfrutar.",
  welcome: "Las recibo con un rico café, una mini degustación. Preparo mi espacio para que todos se sientan cómodos.",
  demo: "Les hago una demo de las recetas que vamos a preparar y luego trabajan ustedes.",
  practice: "¡Y ahí es cuando más aprenden, disfrutan, se ríen y nos divertimos!",
  box: "La mejor parte es que cada uno se lleva una cajita con todo lo que preparamos.",
} as const;

/** Datos de los workshops que salen de las respuestas de Maggie. */
const workshopFacts = {
  duration: "2 h aprox.",
  capacity: "Hasta 8 personas",
  depositRate: 0.5,
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
      label: `${site.name}: pastelería y workshops`,
      // Textos de Maggie (docs/contenido-maggie.md, 01/10).
      eyebrow: "Artesanal, delicado y casero",
      title: "Pastelería y workshops",
      script: "workshops",
      text: "Workshops reducidos en mi cocina y pastelería por encargo. Pedidos con 48 h de anticipación. Take away en San Isidro.",
      primaryCta: { label: "Ver la tienda", href: "/tienda" },
      secondaryCta: { label: "Conocé los workshops", href: "/workshops" },
      carousel: {
        controls: "Controles del carrusel",
        slide: (n: number, total: number) => `${n} de ${total}`,
        dot: (n: number) => `Diapositiva ${n}`,
        previous: "Diapositiva anterior",
        next: "Diapositiva siguiente",
        pause: "Pausar el carrusel",
        play: "Reanudar el carrusel",
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
      // Dos frases textuales de su presentación.
      lead: ownerStory[0],
      text: "Me formé en el IAG como chef profesional y como pastelera en el Ott College.",
      cta: { label: "Conocé mi historia", href: "/maggie" },
      image: ownerImage,
    },
    workshop: {
      eyebrow: "Workshops",
      title: "Grupos reducidos en mi cocina",
      script: "cocina",
      text: [workshopsStory.meeting, workshopsStory.box],
      facts: [workshopFacts.capacity, workshopFacts.duration, site.city],
      next: "Próxima fecha:",
      cta: { label: "Conocé los workshops", href: "/workshops" },
      // TODO(Maggie): reels de los workshops para el video de fondo.
      video: { src: undefined as string | undefined, poster: undefined as string | undefined },
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
    hero: {
      label: `Workshops en la cocina de ${site.owner.name}`,
      eyebrow: "Workshops de pastelería",
      title: "Grupos reducidos en mi cocina",
      script: "cocina",
      text: workshopsStory.meeting,
      cta: { label: "Ver próximas fechas", href: "#agenda" },
      // TODO(Maggie): reels de los workshops para el video de fondo.
      video: { src: undefined as string | undefined, poster: undefined as string | undefined },
    },
    teaching: {
      eyebrow: "Cómo enseño",
      text: workshopsStory.teaching,
      signature: site.owner.name,
      // TODO(Maggie): foto de Maggie enseñando.
      image: { alt: "" } satisfies SiteImage,
    },
    steps: {
      eyebrow: "Paso a paso",
      title: "Cómo es un workshop",
      facts: [workshopFacts.duration, workshopFacts.capacity, `En mi cocina de ${site.city}`, "Reservás con una seña del 50%"],
      items: [
        { title: "Te recibo", text: workshopsStory.welcome },
        { title: "Demo", text: workshopsStory.demo },
        { title: "Manos a la obra", text: workshopsStory.practice },
        { title: "Tu cajita", text: workshopsStory.box },
      ],
    },
    upcoming: {
      eyebrow: "Agenda",
      title: "Próximas fechas",
      note: "Tu lugar solo queda reservado con la seña.",
      spots: (left: number, capacity: number) => `Quedan ${left} de ${capacity}`,
      soldOut: "Agotado",
      cta: "Reservar",
      waitlist: "Avisarme si se libera",
    },
    past: {
      title: "Así fueron los workshops",
      script: "workshops",
      instagram: { label: "Ver más en Instagram", href: site.contact.instagram.url },
      // TODO(Maggie): nombre, mes/año y foto de 4 workshops pasados. Hasta
      // tenerlos, solo el título y el link a Instagram.
    },
    custom: {
      title: "Workshop personalizado",
      text: "Para tu grupo de amigas, un cumpleaños o tu equipo de trabajo. Elegís el tema y la fecha.",
      cta: { label: "Consultar por WhatsApp", href: whatsappLink(whatsappMessages.customWorkshop) },
    },
    faq: {
      title: "Preguntas frecuentes",
      // Respuestas de Maggie (docs/contenido-maggie.md, 01/10).
      items: [
        { question: "¿Dónde es?", answer: "En mi cocina, en San Isidro." },
        {
          question: "¿Cuánto dura?",
          answer:
            "Dura 2 horas aprox. La primera hora es una demostración y la segunda hora trabajan ustedes las recetas que aprendieron.",
        },
        {
          question: "¿Cómo reservo mi lugar?",
          answer: "Completá el formulario y dejá una seña del 50%. Tu lugar solo queda reservado con la seña.",
        },
        {
          question: "¿Puedo cancelar o pasar mi lugar a otra persona si a último momento no puedo ir?",
          answer:
            "¡Sí, obvio! La idea es que esa clase no se pierda. Lo que no hacemos es reembolsar el dinero si no pudo venir nadie.",
        },
        {
          question: "¿Hasta cuántas personas es?",
          answer: "Los workshops son grupos reducidos de hasta 8 personas.",
        },
        {
          question: "¿En qué situación se suspende el workshop?",
          answer: "Si no llegamos a un mínimo de 4 personas, el workshop se reagenda para otra fecha.",
        },
      ],
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
