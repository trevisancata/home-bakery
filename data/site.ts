// Datos generales del sitio. Todo lo que no es "Home Bakery" es un
// placeholder: reemplazar por los datos reales antes de publicar.

export const site = {
  name: "Home Bakery",
  tagline: "Pastelería casera, hecha con tiempo y buenos ingredientes.",
  description:
    "Tortas, budines y cookies caseras por encargo, y workshops para aprender a hacerlos en tu propia cocina.",
  city: "La Plata, Buenos Aires",
  owner: {
    name: "Sofía",
    role: "Pastelera y fundadora",
    bio: [
      "Aprendí a hornear en la cocina de mi abuela, midiendo la harina a ojo y esperando que el budín se enfriara para cortarlo.",
      "Después de años horneando para amigos y familia, en 2023 nació Home Bakery: una pastelería chiquita, con recetas propias, ingredientes de estación y cero apuro.",
      "Hoy también doy workshops para que más personas se animen a hornear en casa.",
    ],
  },
  contact: {
    email: "hola@example.com",
    whatsapp: "+54 9 221 000-0000",
    whatsappUrl: "https://wa.me/5492210000000",
    hours: "Pedidos de lunes a viernes, de 9 a 18 h",
    pickup: "Retiro por zona centro (dirección exacta al confirmar el pedido)",
  },
  social: [
    { name: "Instagram", handle: "@homebakery", url: "https://instagram.com/" },
    { name: "Facebook", handle: "Home Bakery", url: "https://facebook.com/" },
    { name: "TikTok", handle: "@homebakery", url: "https://tiktok.com/" },
  ],
} as const;

export const navigation = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/workshops", label: "Workshops" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
] as const;
