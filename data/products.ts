export type ProductCategory = "Tortas" | "Budines" | "Cookies" | "Tartas";

export type Product = {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  /** Precio en pesos argentinos. */
  price: number;
  /** Porciones o unidades, para mostrar junto al precio. */
  size: string;
  image: { src: string; alt: string };
  featured?: boolean;
};

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
      src: "/images/torta-chocolate.svg",
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
      src: "/images/budin-limon.svg",
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
      src: "/images/cookies-chips.svg",
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
      src: "/images/carrot-cake.svg",
      alt: "Carrot cake de dos pisos cubierta con frosting blanco y nueces picadas",
    },
  },
  {
    id: "tarta-frutillas",
    name: "Tarta de frutillas",
    description:
      "Masa sablée, crema pastelera de vainilla y frutillas frescas de estación.",
    category: "Tartas",
    price: 26000,
    size: "8 porciones",
    image: {
      src: "/images/tarta-frutillas.svg",
      alt: "Tarta redonda cubierta de frutillas frescas cortadas a la mitad sobre crema pastelera",
    },
  },
  {
    id: "budin-banana",
    name: "Budín de banana y nueces",
    description:
      "Hecho con bananas bien maduras, nueces tostadas y azúcar mascabo.",
    category: "Budines",
    price: 9000,
    size: "1 unidad (500 g)",
    image: {
      src: "/images/budin-banana.svg",
      alt: "Budín de banana cortado en rodajas, con nueces a la vista en el interior",
    },
  },
];

export const featuredProducts = products.filter((product) => product.featured);
