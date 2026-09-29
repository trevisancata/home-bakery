// Catálogo de productos. La forma de cada registro sigue la futura tabla
// `products` de Supabase; las páginas lo leen siempre a través de lib/data.ts.

export const productCategories = [
  "Tortas",
  "Tartas",
  "Number cakes",
  "Cookies",
  "Postres en vasito",
  "Bocados",
] as const;

export type ProductCategory = (typeof productCategories)[number];

/** Si la foto todavía no está, se omite `src` y se muestra el placeholder. */
export type ProductImage = { src?: string; alt: string };

export type ProductSize = {
  /** Porciones, unidades o tamaño, tal como se muestra en la tarjeta. */
  label: string;
  /** Precio en pesos argentinos; null mientras no esté confirmado. */
  price: number | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  description: string;
  images: ProductImage[];
  /** El primero es el tamaño por defecto y el que se muestra en las tarjetas. */
  sizes: ProductSize[];
  active: boolean;
  featured: boolean;
  leadTimeHours: number;
  /** Línea corta para la tarjeta del inicio; si falta, se arma con el tamaño. */
  highlight?: string;
};

// TODO: cargar los precios reales (hasta entonces, null → "Precio a confirmar")
// y confirmar los tamaños, que son provisorios.
export const products: Product[] = [
  {
    id: "red-velvet",
    slug: "red-velvet",
    name: "Red velvet",
    category: "Tortas",
    description: "Bizcochuelo rojo aterciopelado con relleno y cobertura de frosting de queso crema.",
    images: [{ alt: "Torta red velvet cortada, con capas rojas y frosting blanco" }],
    sizes: [
      { label: "12 porciones", price: null },
      { label: "20 porciones", price: null },
    ],
    active: true,
    featured: true,
    leadTimeHours: 48,
  },
  {
    id: "tarta-de-frutillas",
    slug: "tarta-de-frutillas",
    name: "Tarta de frutillas",
    category: "Tartas",
    description: "Masa sablée, crema pastelera de vainilla y frutillas frescas de estación.",
    images: [{ alt: "Tarta redonda cubierta de frutillas frescas sobre crema pastelera" }],
    sizes: [{ label: "8 porciones", price: null }],
    active: true,
    featured: true,
    leadTimeHours: 48,
  },
  {
    id: "number-cake",
    slug: "number-cake",
    name: "Number cake",
    category: "Number cakes",
    description: "Dos capas de masa con la forma de tu número o inicial, crema y decoración de frutas, flores y macarons.",
    images: [{ alt: "Torta con forma de número decorada con crema, frutillas y flores" }],
    sizes: [{ label: "15 porciones", price: null }],
    active: true,
    featured: true,
    leadTimeHours: 48,
    highlight: "Tu número o inicial · Por encargo",
  },
  {
    id: "cajita-de-8-cookies",
    slug: "cajita-de-8-cookies",
    name: "Cajita de 8 cookies",
    category: "Cookies",
    description: "Ocho cookies grandes para elegir entre salted caramel, volcán y rocklets.",
    images: [{ alt: "Caja abierta con ocho cookies grandes de distintos sabores" }],
    sizes: [{ label: "8 unidades", price: null }],
    active: true,
    featured: true,
    leadTimeHours: 48,
    highlight: "Salted caramel, volcán, rocklets",
  },
  {
    id: "postres-en-vasito",
    slug: "postres-en-vasito",
    name: "Postres en vasito",
    category: "Postres en vasito",
    description: "Vasitos individuales de chocotorta, tiramisú y lemon pie, ideales para eventos.",
    images: [{ alt: "Vasitos de postre en fila con capas de crema y galletitas" }],
    sizes: [{ label: "12 unidades", price: null }],
    active: true,
    featured: false,
    leadTimeHours: 48,
  },
  {
    id: "datiles-rellenos",
    slug: "datiles-rellenos",
    name: "Dátiles rellenos",
    category: "Bocados",
    description: "Dátiles rellenos de pasta de maní y bañados en chocolate semiamargo.",
    images: [{ alt: "Dátiles bañados en chocolate con una pizca de sal en escamas" }],
    sizes: [{ label: "20 unidades", price: null }],
    active: true,
    featured: false,
    leadTimeHours: 48,
  },
  {
    id: "torta-con-flores",
    slug: "torta-con-flores",
    name: "Torta con flores",
    category: "Tortas",
    description: "Torta de vainilla y frutos rojos decorada con flores comestibles de estación.",
    images: [{ alt: "Torta blanca decorada con flores comestibles en la parte de arriba" }],
    sizes: [{ label: "15 porciones", price: null }],
    active: true,
    featured: false,
    leadTimeHours: 48,
  },
  {
    id: "pavlova-de-frutos-rojos",
    slug: "pavlova-de-frutos-rojos",
    name: "Pavlova de frutos rojos",
    category: "Tartas",
    description: "Merengue crocante por fuera y suave por dentro, con crema y frutos rojos.",
    images: [{ alt: "Pavlova cubierta de crema batida, frutillas, arándanos y frambuesas" }],
    sizes: [{ label: "10 porciones", price: null }],
    active: true,
    featured: false,
    leadTimeHours: 48,
  },
];
