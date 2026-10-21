import sharp from "sharp";
import { categoriaDePrueba } from "./support/productos";
import { admin, expect, hasSupabase, skipReason, test } from "./support/supabase";
import { authFile, testUser } from "./support/usuarios";

test.skip(!hasSupabase, skipReason);

const loginMessage = "El email o la contraseña no coinciden. Probá de nuevo.";

/** Nombre de producto de prueba: el slug empieza con "e2e-" y el teardown lo encuentra. */
const nombreDePrueba = (label: string) => `E2E ${label} ${Math.random().toString(36).slice(2, 8)}`;

/** Una foto PNG real, chica (sharp la genera en memoria). */
function png(width = 12, height = 8) {
  return sharp({ create: { width, height, channels: 3, background: "#a88b6c" } }).png().toBuffer();
}

test.describe("Sin sesión", () => {
  test("/admin redirige al login con el destino en next", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL("/admin/ingresar?next=%2Fadmin");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hola, Maggie");
    const email = page.getByRole("textbox", { name: "Email" });
    await expect(email).toHaveAttribute("autocomplete", "email");
    await expect(page.getByLabel("Contraseña")).toHaveAttribute("autocomplete", "current-password");
  });

  test("login incorrecto: mensaje genérico con foco, también si el email no existe", async ({ page }) => {
    for (const email of [testUser("admin").email, "no-existe@example.com"]) {
      await page.goto("/admin/ingresar");
      await page.getByRole("textbox", { name: "Email" }).fill(email);
      await page.getByLabel("Contraseña").fill("no-es-la-contraseña");
      await page.getByRole("button", { name: "Ingresar" }).click();

      const alert = page.locator("form").getByRole("alert");
      await expect(alert).toHaveText(loginMessage);
      await expect(alert).toBeFocused();
      await expect(page).toHaveURL(/\/admin\/ingresar/);
      // El email queda escrito para corregir solo la contraseña.
      await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue(email);
    }
  });

  test("la API de admin responde 401 JSON", async ({ request }) => {
    for (const response of [
      await request.get("/api/v1/admin/productos"),
      await request.post("/api/v1/admin/productos", { data: { name: "x" } }),
      await request.patch("/api/v1/admin/inscripciones/00000000-0000-0000-0000-000000000000", { data: {} }),
    ]) {
      expect(response.status()).toBe(401);
      expect(response.headers()["cache-control"]).toBe("no-store");
      expect((await response.json()).error.message).toBeTruthy();
    }
  });
});

test.describe("Sin rol", () => {
  test.use({ storageState: authFile.sinRol });

  test("/admin responde 403 con «No tenés permiso»", async ({ page }) => {
    const response = await page.goto("/admin");
    expect(response?.status()).toBe(403);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("No tenés permiso");
    await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  });

  test("la API de admin responde 403", async ({ page }) => {
    const get = await page.request.get("/api/v1/admin/productos");
    expect(get.status()).toBe(403);
    const post = await page.request.post("/api/v1/admin/workshops", { data: { name: "x" } });
    expect(post.status()).toBe(403);
    expect((await post.json()).error).toEqual({ message: "No tenés permiso para hacer esto." });
  });
});

test.describe("Con admin", () => {
  test.use({ storageState: authFile.admin });

  test("crea, edita y borra un producto, y se refleja en la API pública", async ({ page }) => {
    const api = page.request;
    const categoryId = await categoriaDePrueba();
    const name = nombreDePrueba("Budín");

    const created = await api.post("/api/v1/admin/productos", {
      data: { name: `  ${name}  `, categoryId, active: true, sizes: [{ label: "Chico", price: null }, { label: "Grande", price: 12500.5 }] },
    });
    expect(created.status()).toBe(201);
    const { data: product } = await created.json();
    expect(product.name).toBe(name);
    expect(product.slug).toMatch(/^e2e-budin-/);
    expect(product.sizes.map((size: { label: string }) => size.label)).toEqual(["Chico", "Grande"]);

    const slugsPublicos = async () =>
      (await (await api.get("/api/v1/productos")).json()).data.map((item: { slug: string }) => item.slug);
    expect(await slugsPublicos()).toContain(product.slug);

    // Editar: ocultarlo lo saca de la API pública, pero la admin lo sigue viendo.
    const edited = await api.patch(`/api/v1/admin/productos/${product.id}`, {
      data: { active: false, description: "Con limón", sizes: [{ label: "Único", price: 9000 }] },
    });
    expect(edited.status()).toBe(200);
    const { data: hidden } = await edited.json();
    expect(hidden).toMatchObject({ active: false, description: "Con limón", slug: product.slug });
    expect(hidden.sizes).toEqual([expect.objectContaining({ label: "Único", price: 9000 })]);
    expect(await slugsPublicos()).not.toContain(product.slug);
    expect((await api.get(`/api/v1/productos/${product.slug}`)).status()).toBe(404);

    const all = (await (await api.get("/api/v1/admin/productos")).json()).data;
    expect(all.find((item: { id: string }) => item.id === product.id)).toBeTruthy();

    await api.patch(`/api/v1/admin/productos/${product.id}`, { data: { active: true } });
    expect(await slugsPublicos()).toContain(product.slug);

    const deleted = await api.delete(`/api/v1/admin/productos/${product.id}`);
    expect(deleted.status()).toBe(204);
    expect(await slugsPublicos()).not.toContain(product.slug);
    expect((await api.get(`/api/v1/admin/productos/${product.id}`)).status()).toBe(404);
  });

  test("valida y sanea: 400 con los campos, sin HTML ni campos desconocidos", async ({ page }) => {
    const response = await page.request.post("/api/v1/admin/productos", {
      data: { name: "<b>E2E</b>", categoryId: "no-es-uuid", sizes: [{ label: "", price: -1 }], admin: true },
    });
    expect(response.status()).toBe(400);
    const { error } = await response.json();
    expect(error.fields).toMatchObject({
      name: "No uses etiquetas HTML.",
      categoryId: "Elegí una categoría.",
      "sizes.0.label": "Completá este campo.",
      "sizes.0.price": "El precio no puede ser negativo.",
    });
    // Un campo que no está en el esquema (asignación masiva): rechazado.
    expect(error.fields.body).toContain("admin");

    const json = await page.request.post("/api/v1/admin/productos", {
      headers: { "Content-Type": "application/json" },
      data: "{roto",
    });
    expect(json.status()).toBe(400);

    // Un id que no existe (o que no es uuid) es 404.
    expect((await page.request.get("/api/v1/admin/productos/no-existe")).status()).toBe(404);
    expect((await page.request.patch(`/api/v1/admin/productos/00000000-0000-4000-8000-000000000000`, { data: { name: "x" } })).status()).toBe(404);
  });

  test("rechaza escrituras desde otro origen (403)", async ({ page }) => {
    const response = await page.request.post("/api/v1/admin/productos", {
      headers: { Origin: "https://otro-sitio.example" },
      data: { name: nombreDePrueba("Origen") },
    });
    expect(response.status()).toBe(403);
  });

  test("sube, edita y borra una foto en Storage", async ({ page, request }) => {
    const api = page.request;
    const { data: product } = await (
      await api.post("/api/v1/admin/productos", { data: { name: nombreDePrueba("Foto"), categoryId: await categoriaDePrueba() } })
    ).json();
    const imagenes = `/api/v1/admin/productos/${product.id}/imagenes`;

    const uploaded = await api.post(imagenes, {
      multipart: { file: { name: "foto.png", mimeType: "image/png", buffer: await png(12, 8) }, alt: "Budín de prueba" },
    });
    expect(uploaded.status()).toBe(201);
    const { data: image } = await uploaded.json();
    expect(image).toMatchObject({ alt: "Budín de prueba", width: 12, height: 8, cover: true });
    expect(image.path).toMatch(new RegExp(`^${product.slug}/[0-9a-f-]{36}\\.png$`));
    expect((await request.get(image.src)).status()).toBe(200);

    // Un archivo que dice ser PNG pero no lo es: 400.
    const fake = await api.post(imagenes, {
      multipart: { file: { name: "foto.png", mimeType: "image/png", buffer: Buffer.from("no soy una imagen") }, alt: "x" },
    });
    expect(fake.status()).toBe(400);
    expect((await fake.json()).error.fields.file).toBe("El archivo no es una foto webp, jpg o png.");

    const patched = await api.patch(`${imagenes}/${image.id}`, { data: { alt: "Budín recién horneado", order: 3 } });
    expect(patched.status()).toBe(200);
    expect((await patched.json()).data).toMatchObject({ alt: "Budín recién horneado", order: 3 });

    expect((await api.delete(`${imagenes}/${image.id}`)).status()).toBe(204);
    // La URL pública puede seguir en la caché del CDN un rato: se mira Storage directo.
    const { data: archivos } = await admin().storage.from("productos").list(product.slug);
    expect(archivos ?? []).toEqual([]);
    const { data: after } = await (await api.get(`/api/v1/admin/productos/${product.id}`)).json();
    expect(after.images).toEqual([]);

    expect((await api.delete(`/api/v1/admin/productos/${product.id}`)).status()).toBe(204);
  });

  test("cambia el estado de una inscripción y respeta el cupo", async ({ page, workshop }) => {
    const api = page.request;
    const inscribir = (spots: number) =>
      api.post("/api/v1/inscripciones", {
        data: { workshopSlug: workshop.slug, name: "Prueba E2E", whatsapp: "11 5555-6666", email: "prueba@ejemplo.com", acceptsPolicy: true, spots },
      });
    expect((await inscribir(4)).status()).toBe(201);

    const lista = await api.get(`/api/v1/admin/workshops/${workshop.id}/inscripciones`);
    expect(lista.status()).toBe(200);
    expect(lista.headers()["cache-control"]).toBe("no-store");
    const [inscripcion] = (await lista.json()).data;
    expect(inscripcion).toMatchObject({ name: "Prueba E2E", spots: 4, status: "pendiente_sena" });

    const url = `/api/v1/admin/inscripciones/${inscripcion.id}`;
    const reservada = await api.patch(url, { data: { status: "reservada" } });
    expect(reservada.status()).toBe(200);
    expect((await reservada.json()).data.status).toBe("reservada");

    // Cancelada libera los 4 lugares; si otra persona los toma, no se puede reactivar.
    expect((await api.patch(url, { data: { status: "cancelada" } })).status()).toBe(200);
    expect((await inscribir(5)).status()).toBe(201);
    const sinCupo = await api.patch(url, { data: { status: "reservada" } });
    expect(sinCupo.status()).toBe(409);
    expect((await sinCupo.json()).error.spotsLeft).toBe(1);

    expect((await api.patch(url, { data: { status: "borrada" } })).status()).toBe(400);

    // Un workshop con inscripciones no se borra.
    const borrar = await api.delete(`/api/v1/admin/workshops/${workshop.id}`);
    expect(borrar.status()).toBe(409);
  });

  test("crea, edita y borra un workshop", async ({ page }) => {
    const api = page.request;
    const startsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const created = await api.post("/api/v1/admin/workshops", {
      data: { name: nombreDePrueba("Workshop"), startsAt, capacity: 6, minimum: 2, active: false },
    });
    expect(created.status()).toBe(201);
    const { data: workshop } = await created.json();
    expect(workshop).toMatchObject({ capacity: 6, minimum: 2, active: false, spotsTaken: 0 });
    expect(workshop.slug).toMatch(/^e2e-workshop-/);

    const invalid = await api.patch(`/api/v1/admin/workshops/${workshop.id}`, { data: { capacity: 2, minimum: 4 } });
    expect(invalid.status()).toBe(400);

    const edited = await api.patch(`/api/v1/admin/workshops/${workshop.id}`, { data: { level: "Inicial", price: 30000 } });
    expect((await edited.json()).data).toMatchObject({ level: "Inicial", price: 30000 });

    expect((await api.delete(`/api/v1/admin/workshops/${workshop.id}`)).status()).toBe(204);
    expect((await api.get(`/api/v1/admin/workshops/${workshop.id}`)).status()).toBe(404);
  });
});
