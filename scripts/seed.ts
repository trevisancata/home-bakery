/**
 * Carga el catálogo de Maggie y los workshops en Supabase.
 *
 *   npm run seed
 *
 * - Lee supabase/seed/catalogo.json (el bloque "revision" no se carga).
 * - Sube las fotos desde CATALOGO_FOTOS_DIR al bucket "productos".
 * - Hace upsert por slug: correrlo dos veces deja la base igual.
 * - Los productos con activo: false quedan cargados pero ocultos (RLS).
 * - Workshops: los de data/workshops.ts, marcados como de ejemplo.
 *
 * Usa la secret key (lib/supabase/admin.ts). Solo imprime conteos: nunca
 * claves ni URLs.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { workshops } from "../data/workshops.ts";
import { createAdminClient } from "../lib/supabase/admin.ts";

type CatalogoImagen = {
  archivo: string;
  portada: boolean;
  alt: string;
  sabor: string | null;
  ancho: number;
  alto: number;
};

type CatalogoProducto = {
  slug: string;
  nombre: string;
  categoria: string;
  descripcion: string | null;
  medida: string | null;
  porciones: string | null;
  peso: string | null;
  unidades: string | null;
  temporada: { desde_mes: number; hasta_mes: number; texto: string } | null;
  tamanos: { etiqueta: string; precio: number | null }[];
  a_medida: boolean;
  anticipacion_horas: number;
  activo: boolean;
  destacado: boolean;
  orden: number;
  sabores: string[] | null;
  decoraciones: string[] | null;
  imagenes: CatalogoImagen[];
};

type Catalogo = {
  categorias: { slug: string; nombre: string; orden: number; a_medida: boolean }[];
  productos: CatalogoProducto[];
};

const root = path.resolve(import.meta.dirname, "..");
const supabase = createAdminClient();

/** Corta con un mensaje claro. Los errores de Supabase no incluyen claves. */
function check<T>(result: { data: T | null; error: { code?: string; message: string } | null }, step: string): T {
  if (result.error) {
    const hint =
      result.error.code === "42501"
        ? " Falta un permiso para service_role: revisá que la migración se haya corrido completa."
        : result.error.code === "42P01" || result.error.code === "PGRST205"
          ? " La tabla no existe: corré supabase/migrations/0001_catalogo.sql en el SQL Editor."
          : "";
    throw new Error(`${step}: ${result.error.message} (${result.error.code ?? "sin código"}).${hint}`);
  }
  return result.data as T;
}

/** La carpeta puede ser la del catálogo (con fotos/ adentro) o fotos/ misma. */
function photoPath(dir: string, archivo: string) {
  const direct = path.join(dir, archivo);
  if (existsSync(direct)) return direct;
  const inside = path.join(dir, archivo.replace(/^fotos\//, ""));
  if (existsSync(inside)) return inside;
  throw new Error(`No encuentro la foto ${archivo} en CATALOGO_FOTOS_DIR.`);
}

/** Reintenta una tarea ante fallas transitorias de red (3 intentos, espera creciente). */
async function withRetries<T>(task: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
}

/** Corre las tareas de a `size` por vez. */
async function inBatches<T>(items: T[], size: number, task: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(task));
  }
}

async function seedCatalogo() {
  const photosDir = process.env.CATALOGO_FOTOS_DIR;
  if (!photosDir) throw new Error("Falta la variable de entorno CATALOGO_FOTOS_DIR. Ver .env.example.");

  const catalogo = JSON.parse(await readFile(path.join(root, "supabase/seed/catalogo.json"), "utf8")) as Catalogo;

  // Categorías
  const categorias = check(
    await supabase
      .from("categorias")
      .upsert(
        catalogo.categorias.map((c) => ({ slug: c.slug, nombre: c.nombre, orden: c.orden, a_medida: c.a_medida })),
        { onConflict: "slug" },
      )
      .select("id, slug"),
    "Categorías",
  );
  const categoriaId = new Map(categorias.map((c) => [c.slug, c.id as string]));

  // Productos ("unidades" del catálogo → presentacion)
  const productos = check(
    await supabase
      .from("productos")
      .upsert(
        catalogo.productos.map((p) => {
          const id = categoriaId.get(p.categoria);
          if (!id) throw new Error(`El producto ${p.slug} tiene una categoría que no existe: ${p.categoria}.`);
          return {
            categoria_id: id,
            slug: p.slug,
            nombre: p.nombre,
            descripcion: p.descripcion,
            medida: p.medida,
            porciones: p.porciones,
            peso: p.peso,
            presentacion: p.unidades,
            temporada_desde_mes: p.temporada?.desde_mes ?? null,
            temporada_hasta_mes: p.temporada?.hasta_mes ?? null,
            a_medida: p.a_medida,
            anticipacion_horas: p.anticipacion_horas,
            activo: p.activo,
            destacado: p.destacado,
            orden: p.orden,
            sabores: p.sabores ?? [],
            decoraciones: p.decoraciones ?? [],
          };
        }),
        { onConflict: "slug" },
      )
      .select("id, slug"),
    "Productos",
  );
  const productoId = new Map(productos.map((p) => [p.slug, p.id as string]));

  // Tamaños: upsert y borrado de los que ya no están en el catálogo.
  const tamanos = catalogo.productos.flatMap((p) =>
    p.tamanos.map((t, orden) => ({
      producto_id: productoId.get(p.slug)!,
      etiqueta: t.etiqueta,
      precio: t.precio,
      orden,
    })),
  );
  check(await supabase.from("producto_tamanos").upsert(tamanos, { onConflict: "producto_id,etiqueta" }), "Tamaños");
  const tamanosActuales = check(
    await supabase.from("producto_tamanos").select("id, producto_id, etiqueta"),
    "Tamaños actuales",
  );
  const tamanosValidos = new Set(tamanos.map((t) => `${t.producto_id}|${t.etiqueta}`));
  const tamanosSobrantes = tamanosActuales
    .filter((t) => !tamanosValidos.has(`${t.producto_id}|${t.etiqueta}`))
    .map((t) => t.id as string);
  if (tamanosSobrantes.length > 0) {
    check(await supabase.from("producto_tamanos").delete().in("id", tamanosSobrantes), "Tamaños sobrantes");
  }

  // Fotos: se suben con upsert (idempotente) a productos/<slug>/<archivo>.webp
  const imagenes = catalogo.productos.flatMap((p) =>
    p.imagenes.map((img, orden) => ({
      archivo: img.archivo,
      row: {
        producto_id: productoId.get(p.slug)!,
        ruta: `${p.slug}/${path.basename(img.archivo)}`,
        alt: img.alt,
        sabor: img.sabor,
        ancho: img.ancho,
        alto: img.alto,
        portada: img.portada,
        orden,
      },
    })),
  );

  let subidas = 0;
  await inBatches(imagenes, 6, async ({ archivo, row }) => {
    const file = await readFile(photoPath(photosDir, archivo));
    await withRetries(async () =>
      check(
        await supabase.storage
          .from("productos")
          .upload(row.ruta, file, { contentType: "image/webp", cacheControl: "86400", upsert: true }),
        `Foto ${row.ruta}`,
      ),
    );
    subidas++;
  });

  // Primero se sacan las portadas viejas para no chocar con el índice único
  // (una portada por producto) si cambió cuál es la -1.
  check(
    await supabase.from("producto_imagenes").update({ portada: false }).eq("portada", true),
    "Portadas",
  );
  check(
    await supabase
      .from("producto_imagenes")
      .upsert(
        imagenes.map((i) => i.row),
        { onConflict: "producto_id,ruta" },
      ),
    "Imágenes",
  );
  const imagenesActuales = check(await supabase.from("producto_imagenes").select("id, producto_id, ruta"), "Imágenes actuales");
  const imagenesValidas = new Set(imagenes.map((i) => `${i.row.producto_id}|${i.row.ruta}`));
  const imagenesSobrantes = imagenesActuales
    .filter((i) => !imagenesValidas.has(`${i.producto_id}|${i.ruta}`))
    .map((i) => i.id as string);
  if (imagenesSobrantes.length > 0) {
    check(await supabase.from("producto_imagenes").delete().in("id", imagenesSobrantes), "Imágenes sobrantes");
  }

  return { subidas };
}

async function seedWorkshops() {
  // TODO(Maggie): cargar los workshops reales. Hasta entonces, las fechas de
  // data/workshops.ts se muestran con aviso y no aceptan inscripciones.
  check(
    await supabase.from("workshops").upsert(
      workshops.map((w) => ({
        slug: w.slug,
        nombre: w.name,
        resumen: w.summary,
        descripcion: w.description,
        nivel: w.level,
        incluye: null,
        fecha_inicio: w.startsAt,
        duracion_min: w.durationMinutes,
        precio: w.price,
        cupo: w.capacity,
        activo: w.active,
        destacado: w.featured,
        es_ejemplo: true,
      })),
      { onConflict: "slug" },
    ),
    "Workshops",
  );
}

async function count(table: string, filter?: (q: ReturnType<typeof countQuery>) => ReturnType<typeof countQuery>) {
  const query = countQuery(table);
  const { count: total, error } = await (filter ? filter(query) : query);
  if (error) throw new Error(`Conteo de ${table}: ${error.message}`);
  return total ?? 0;
}

function countQuery(table: string) {
  return supabase.from(table).select("*", { count: "exact", head: true });
}

const { subidas } = await seedCatalogo();
await seedWorkshops();

console.log("Seed terminado:");
console.log(`  categorías         ${await count("categorias")}`);
console.log(`  productos          ${await count("productos")} (${await count("productos", (q) => q.eq("activo", false))} ocultos)`);
console.log(`  tamaños            ${await count("producto_tamanos")}`);
console.log(`  imágenes           ${await count("producto_imagenes")} (${subidas} fotos subidas)`);
console.log(`  workshops          ${await count("workshops")} (${await count("workshops", (q) => q.eq("es_ejemplo", true))} de ejemplo)`);
