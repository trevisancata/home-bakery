import type { APIRequestContext } from "@playwright/test";
import {
  borrarWorkshopsDePrueba,
  crearWorkshopDePrueba,
  expect,
  hasSupabase,
  lugaresOcupados,
  skipReason,
  test,
  testSlugPrefix,
} from "./support/supabase";
import { borrarProductoDePrueba, crearProductoDePrueba } from "./support/productos";

test.skip(!hasSupabase, skipReason);

const slugsDe = (data: { slug: string }[]) => data.map((product) => product.slug);

/** Cuerpo válido de una inscripción; se pisa lo que haga falta. */
function inscripcion(workshopSlug: string, overrides: Record<string, unknown> = {}) {
  return {
    workshopSlug,
    name: "Prueba E2E",
    whatsapp: "11 5555-6666",
    email: "prueba@ejemplo.com",
    acceptsPolicy: true,
    spots: 1,
    ...overrides,
  };
}

test.describe("GET /api/v1/categorias", () => {
  // Es el único dato real que se compara: las categorías son fijas del sitio
  // (salen del seed) y Maggie no las edita desde el panel. Crear categorías
  // de prueba cambiaría esta misma lista y los filtros de la tienda mientras
  // corren los otros tests en paralelo.
  test("devuelve las categorías activas en orden, con caché", async ({ request }) => {
    const response = await request.get("/api/v1/categorias");
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("s-maxage=300");
    const { data } = await response.json();
    expect(data.map((category: { slug: string }) => category.slug)).toEqual([
      "tortas",
      "tortas-especiales",
      "number-cakes",
      "budines",
      "cuadrados-y-bites",
      "postres",
      "freezados",
    ]);
  });
});

test.describe("GET /api/v1/productos", () => {
  test("devuelve solo los productos activos", async ({ request }) => {
    // Sin contar el total: el catálogo real lo edita Maggie.
    const activo = await crearProductoDePrueba();
    const oculto = await crearProductoDePrueba({ active: false });
    try {
      const response = await request.get("/api/v1/productos");
      expect(response.status()).toBe(200);
      const slugs = slugsDe((await response.json()).data);
      expect(slugs).toContain(activo.slug);
      expect(slugs).not.toContain(oculto.slug);
    } finally {
      await borrarProductoDePrueba(activo.id);
      await borrarProductoDePrueba(oculto.id);
    }
  });

  test("filtra por categoría", async ({ request }) => {
    const budin = await crearProductoDePrueba({ categoria: "budines" });
    const postre = await crearProductoDePrueba({ categoria: "postres" });
    try {
      const { data } = await (await request.get("/api/v1/productos?categoria=budines")).json();
      expect(slugsDe(data)).toContain(budin.slug);
      expect(slugsDe(data)).not.toContain(postre.slug);
      for (const product of data) expect(product.category.slug).toBe("budines");
    } finally {
      await borrarProductoDePrueba(budin.id);
      await borrarProductoDePrueba(postre.id);
    }
  });

  test("filtra por destacados", async ({ request }) => {
    // Productos propios: los destacados reales los elige Maggie y pueden no
    // existir (el chequeo de abajo pasaría sin probar nada).
    const destacado = await crearProductoDePrueba({ featured: true });
    const comun = await crearProductoDePrueba();
    try {
      const response = await request.get("/api/v1/productos?destacados=true");
      expect(response.status()).toBe(200);
      const { data } = await response.json();
      const slugs = data.map((product: { slug: string }) => product.slug);
      expect(slugs).toContain(destacado.slug);
      expect(slugs).not.toContain(comun.slug);
      for (const product of data) expect(product.featured).toBe(true);
    } finally {
      await borrarProductoDePrueba(destacado.id);
      await borrarProductoDePrueba(comun.id);
    }
  });

  for (const query of ["categoria=NO%20VALE", "categoria=inexistente", "destacados=quizas"]) {
    test(`responde 400 con ?${query}`, async ({ request }) => {
      const response = await request.get(`/api/v1/productos?${query}`);
      expect(response.status()).toBe(400);
      expect(response.headers()["cache-control"]).toBe("no-store");
      const body = await response.json();
      expect(body.error.message).toBeTruthy();
      expect(Object.keys(body.error.fields).length).toBeGreaterThan(0);
    });
  }
});

test.describe("GET /api/v1/productos/[slug]", () => {
  test("devuelve un producto activo", async ({ request }) => {
    const producto = await crearProductoDePrueba({ images: 2 });
    try {
      const response = await request.get(`/api/v1/productos/${producto.slug}`);
      expect(response.status()).toBe(200);
      const { data } = await response.json();
      expect(data.name).toBe(producto.name);
      expect(data.images).toHaveLength(2);
    } finally {
      await borrarProductoDePrueba(producto.id);
    }
  });

  test("responde 404 para un producto oculto", async ({ request }) => {
    const oculto = await crearProductoDePrueba({ active: false });
    try {
      const response = await request.get(`/api/v1/productos/${oculto.slug}`);
      expect(response.status()).toBe(404);
      expect((await response.json()).error.message).toBeTruthy();
    } finally {
      await borrarProductoDePrueba(oculto.id);
    }
  });

  test("responde 404 para un producto que no existe", async ({ request }) => {
    const response = await request.get(`/api/v1/productos/${testSlugPrefix}no-existe`);
    expect(response.status()).toBe(404);
    expect((await response.json()).error.message).toBeTruthy();
  });
});

test.describe("GET /api/v1/workshops", () => {
  test("incluye los próximos con lugares libres", async ({ request, workshop }) => {
    const { data } = await (await request.get("/api/v1/workshops")).json();
    const found = data.find((item: { slug: string }) => item.slug === workshop.slug);
    expect(found).toMatchObject({ spotsLeft: 6, capacity: 6, isExample: false });
  });

  test("marca los de ejemplo", async ({ request }) => {
    const ejemplo = await crearWorkshopDePrueba({ esEjemplo: true });
    try {
      const { data } = await (await request.get("/api/v1/workshops")).json();
      expect(data.find((item: { slug: string }) => item.slug === ejemplo.slug)).toMatchObject({ isExample: true });
    } finally {
      await borrarWorkshopsDePrueba([ejemplo.id]);
    }
  });
});

test.describe("POST /api/v1/inscripciones", () => {
  test("crea la inscripción y descuenta el cupo", async ({ request, workshop }) => {
    const response = await request.post("/api/v1/inscripciones", { data: inscripcion(workshop.slug, { spots: 2 }) });
    expect(response.status()).toBe(201);
    const { data } = await response.json();
    expect(data.id).toMatch(/^[0-9a-f-]{36}$/);
    // El link de pago de Checkout Pro (en los e2e, el del mock de MP).
    expect(data.initPoint).toMatch(/\/checkout\?pref_id=pref-e2e-/);
    expect(await lugaresOcupados(workshop.id)).toBe(2);

    const { data: workshops } = await (await request.get("/api/v1/workshops")).json();
    expect(workshops.find((item: { slug: string }) => item.slug === workshop.slug).spotsLeft).toBe(4);
  });

  test("400 si el JSON no es válido", async ({ request }) => {
    const response = await request.post("/api/v1/inscripciones", {
      headers: { "Content-Type": "application/json" },
      data: "{roto",
    });
    expect(response.status()).toBe(400);
  });

  test("400 con los errores por campo", async ({ request, workshop }) => {
    const response = await request.post("/api/v1/inscripciones", {
      data: inscripcion(workshop.slug, { email: "sin-arroba", acceptsPolicy: false }),
    });
    expect(response.status()).toBe(400);
    const { error } = await response.json();
    expect(Object.keys(error.fields)).toEqual(expect.arrayContaining(["email", "acceptsPolicy"]));
  });

  test("404 si el workshop no existe", async ({ request }) => {
    const response = await request.post("/api/v1/inscripciones", { data: inscripcion("no-existe") });
    expect(response.status()).toBe(404);
  });

  test("404 si el workshop es de ejemplo", async ({ request }) => {
    const ejemplo = await crearWorkshopDePrueba({ esEjemplo: true });
    try {
      const response = await request.post("/api/v1/inscripciones", { data: inscripcion(ejemplo.slug) });
      expect(response.status()).toBe(404);
    } finally {
      await borrarWorkshopsDePrueba([ejemplo.id]);
    }
  });

  test("409 con los lugares libres si no alcanza el cupo", async ({ request, workshop }) => {
    await request.post("/api/v1/inscripciones", { data: inscripcion(workshop.slug, { spots: 5 }) });
    const response = await request.post("/api/v1/inscripciones", { data: inscripcion(workshop.slug, { spots: 2 }) });
    expect(response.status()).toBe(409);
    const { error } = await response.json();
    expect(error.spotsLeft).toBe(1);
  });

  test("no sobrevende con inscripciones simultáneas", async ({ request }) => {
    // Cupo 3 y diez pedidos de 2 lugares a la vez: solo uno puede entrar.
    const workshop = await crearWorkshopDePrueba({ cupo: 3 });
    try {
      const responses = await Promise.all(
        Array.from({ length: 10 }, () =>
          request.post("/api/v1/inscripciones", { data: inscripcion(workshop.slug, { spots: 2 }) }),
        ),
      );
      const statuses = responses.map((response) => response.status()).sort();
      expect(statuses.filter((status) => status === 201)).toHaveLength(1);
      expect(statuses.filter((status) => status === 409)).toHaveLength(9);
      expect(await lugaresOcupados(workshop.id)).toBe(2);
    } finally {
      await borrarWorkshopsDePrueba([workshop.id]);
    }
  });
});

test.describe("Rutas viejas de la API", () => {
  /** La ruta vieja redirige con 308 a la de /api/v1, y siguiendo el redirect responde 200. */
  async function redirige(request: APIRequestContext, path: string) {
    const response = await request.get(`/api/${path}`, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(`/api/v1/${path}`);
    expect((await request.get(`/api/${path}`)).status()).toBe(200);
  }

  for (const path of ["categorias", "productos?categoria=budines", "workshops"]) {
    test(`/api/${path} redirige con 308 a /api/v1`, async ({ request }) => {
      await redirige(request, path);
    });
  }

  test("/api/productos/<slug> redirige con 308 a /api/v1", async ({ request }) => {
    const producto = await crearProductoDePrueba();
    try {
      await redirige(request, `productos/${producto.slug}`);
    } finally {
      await borrarProductoDePrueba(producto.id);
    }
  });

  test("POST /api/inscripciones redirige con 308 (conserva el método)", async ({ request }) => {
    const response = await request.post("/api/inscripciones", { data: inscripcion("no-existe"), maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/api/v1/inscripciones");
  });
});
