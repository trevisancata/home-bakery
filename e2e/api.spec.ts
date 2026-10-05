import { crearWorkshopDePrueba, borrarWorkshopsDePrueba, expect, hasSupabase, lugaresOcupados, skipReason, test } from "./support/supabase";

test.skip(!hasSupabase, skipReason);

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

test.describe("GET /api/categorias", () => {
  test("devuelve las categorías activas en orden, con caché", async ({ request }) => {
    const response = await request.get("/api/categorias");
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

test.describe("GET /api/productos", () => {
  test("devuelve solo los productos activos", async ({ request }) => {
    const response = await request.get("/api/productos");
    expect(response.status()).toBe(200);
    const { data } = await response.json();
    expect(data).toHaveLength(70);
    expect(data.map((product: { slug: string }) => product.slug)).not.toContain("red-velvet");
  });

  test("filtra por categoría", async ({ request }) => {
    const { data } = await (await request.get("/api/productos?categoria=budines")).json();
    expect(data.length).toBeGreaterThan(0);
    for (const product of data) expect(product.category.slug).toBe("budines");
  });

  test("filtra por destacados", async ({ request }) => {
    const response = await request.get("/api/productos?destacados=true");
    expect(response.status()).toBe(200);
    const { data } = await response.json();
    for (const product of data) expect(product.featured).toBe(true);
  });

  for (const query of ["categoria=NO%20VALE", "categoria=inexistente", "destacados=quizas"]) {
    test(`responde 400 con ?${query}`, async ({ request }) => {
      const response = await request.get(`/api/productos?${query}`);
      expect(response.status()).toBe(400);
      expect(response.headers()["cache-control"]).toBe("no-store");
      const body = await response.json();
      expect(body.error.message).toBeTruthy();
      expect(Object.keys(body.error.fields).length).toBeGreaterThan(0);
    });
  }
});

test.describe("GET /api/productos/[slug]", () => {
  test("devuelve un producto activo", async ({ request }) => {
    const response = await request.get("/api/productos/budin-de-chocolate");
    expect(response.status()).toBe(200);
    const { data } = await response.json();
    expect(data.name).toBe("Budín de chocolate");
    expect(data.images.length).toBeGreaterThan(0);
  });

  for (const slug of ["red-velvet", "no-existe"]) {
    test(`responde 404 para ${slug}`, async ({ request }) => {
      const response = await request.get(`/api/productos/${slug}`);
      expect(response.status()).toBe(404);
      expect((await response.json()).error.message).toBeTruthy();
    });
  }
});

test.describe("GET /api/workshops", () => {
  test("incluye los próximos con lugares libres", async ({ request, workshop }) => {
    const { data } = await (await request.get("/api/workshops")).json();
    const found = data.find((item: { slug: string }) => item.slug === workshop.slug);
    expect(found).toMatchObject({ spotsLeft: 6, capacity: 6, isExample: false });
    // Los de ejemplo vienen marcados.
    expect(data.find((item: { slug: string }) => item.slug === "budines-para-empezar")?.isExample).toBe(true);
  });
});

test.describe("POST /api/inscripciones", () => {
  test("crea la inscripción y descuenta el cupo", async ({ request, workshop }) => {
    const response = await request.post("/api/inscripciones", { data: inscripcion(workshop.slug, { spots: 2 }) });
    expect(response.status()).toBe(201);
    const { data } = await response.json();
    expect(data.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await lugaresOcupados(workshop.id)).toBe(2);

    const { data: workshops } = await (await request.get("/api/workshops")).json();
    expect(workshops.find((item: { slug: string }) => item.slug === workshop.slug).spotsLeft).toBe(4);
  });

  test("400 si el JSON no es válido", async ({ request }) => {
    const response = await request.post("/api/inscripciones", {
      headers: { "Content-Type": "application/json" },
      data: "{roto",
    });
    expect(response.status()).toBe(400);
  });

  test("400 con los errores por campo", async ({ request, workshop }) => {
    const response = await request.post("/api/inscripciones", {
      data: inscripcion(workshop.slug, { email: "sin-arroba", acceptsPolicy: false }),
    });
    expect(response.status()).toBe(400);
    const { error } = await response.json();
    expect(Object.keys(error.fields)).toEqual(expect.arrayContaining(["email", "acceptsPolicy"]));
  });

  test("404 si el workshop no existe", async ({ request }) => {
    const response = await request.post("/api/inscripciones", { data: inscripcion("no-existe") });
    expect(response.status()).toBe(404);
  });

  test("404 si el workshop es de ejemplo", async ({ request }) => {
    const response = await request.post("/api/inscripciones", { data: inscripcion("budines-para-empezar") });
    expect(response.status()).toBe(404);
  });

  test("409 con los lugares libres si no alcanza el cupo", async ({ request, workshop }) => {
    await request.post("/api/inscripciones", { data: inscripcion(workshop.slug, { spots: 5 }) });
    const response = await request.post("/api/inscripciones", { data: inscripcion(workshop.slug, { spots: 2 }) });
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
          request.post("/api/inscripciones", { data: inscripcion(workshop.slug, { spots: 2 }) }),
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
