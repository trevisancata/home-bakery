// Acceso a los datos del sitio. Hoy lee los archivos de data/; cuando exista
// Supabase, estas funciones pasan a consultar las tablas sin que las páginas
// cambien. Por eso son async aunque todavía no esperen nada.

import { productCategories, products, type ProductCategory } from "@/data/products";
import { workshops, type Workshop } from "@/data/workshops";
import { getSpotsLeft } from "@/lib/inscripciones";

export type { Product, ProductCategory, ProductImage, ProductSize } from "@/data/products";
export type { Workshop, WorkshopImage } from "@/data/workshops";

/** Productos activos, en el orden del catálogo (el orden "Destacados"). */
export async function getProducts(category?: ProductCategory) {
  return products.filter((product) => product.active && (!category || product.category === category));
}

export async function getFeaturedProducts() {
  return (await getProducts()).filter((product) => product.featured);
}

/** Categorías que tienen al menos un producto activo, en el orden del catálogo. */
export async function getProductCategories() {
  const active = await getProducts();
  return productCategories.filter((category) => active.some((product) => product.category === category));
}

/** Los lugares libres descuentan las inscripciones ya recibidas. */
function withSpotsLeft(workshop: Workshop): Workshop {
  return { ...workshop, spotsLeft: getSpotsLeft(workshop) };
}

/** Workshops activos que todavía no empezaron, del más próximo al más lejano. */
export async function getWorkshops(now = new Date()) {
  return workshops
    .filter((workshop) => workshop.active && new Date(workshop.startsAt) > now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .map(withSpotsLeft);
}

/** Un workshop abierto a inscripción (activo y sin empezar), o undefined. */
export async function getWorkshop(slug: string, now = new Date()) {
  return (await getWorkshops(now)).find((workshop) => workshop.slug === slug);
}

/** El workshop del mes: el destacado o, si no hay, el próximo. */
export async function getFeaturedWorkshop() {
  const upcoming = await getWorkshops();
  return upcoming.find((workshop) => workshop.featured) ?? upcoming[0];
}

/** Página de inscripción de un workshop. */
export function workshopEnrollHref(slug: string) {
  return `/workshops/${slug}/inscripcion`;
}
