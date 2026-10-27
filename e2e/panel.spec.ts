import type { APIRequestContext, Page } from "@playwright/test";
import sharp from "sharp";
import { avisarPago, cargarPago, nuevoPagoId } from "./support/pagos";
import { categoriaDePrueba, crearProductoDePrueba } from "./support/productos";
import { admin, expect, hasSupabase, skipReason, test } from "./support/supabase";
import { authFile } from "./support/usuarios";

// Panel de Maggie con la admin de prueba. Todo lo que se crea es "E2E …"
// (slug "e2e-…") y lo borra el teardown.

test.skip(!hasSupabase, skipReason);
test.use({ storageState: authFile.admin });

const nombre = (label: string) => `E2E ${label} ${Math.random().toString(36).slice(2, 7)}`;

async function crearProducto(api: APIRequestContext, data: Record<string, unknown> = {}) {
  const response = await api.post("/api/v1/admin/productos", {
    data: { name: nombre("Panel"), categoryId: await categoriaDePrueba(), active: true, sizes: [{ label: "Único", price: 1000 }], ...data },
  });
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()).data as { id: string; slug: string; name: string };
}

/** El aviso del panel (role="status" o "alert") con un texto. */
const aviso = (page: Page, texto: string | RegExp) => page.getByText(texto).filter({ visible: true });

test.describe("Productos", () => {
  test("edita un precio en línea y se ve en la tienda", async ({ page }) => {
    const producto = await crearProducto(page.request);
    await page.goto(`/admin/productos?q=${encodeURIComponent(producto.name)}`);

    const precio = page.getByRole("textbox", { name: `Precio de ${producto.name}` });
    await expect(precio).toHaveValue("1.000");
    await precio.fill("12.345");
    await precio.press("Enter");
    await expect(page.getByTestId(`producto-${producto.id}`).getByText("Guardado")).toBeVisible();

    await page.goto(`/tienda/${producto.slug}`);
    await expect(page.getByText(/12\.345/).first()).toBeVisible();
  });

  test("pausar lo saca de la tienda y Deshacer lo vuelve a mostrar", async ({ page }) => {
    const producto = await crearProducto(page.request);
    await page.goto("/tienda");
    await expect(page.getByText(producto.name).first()).toBeVisible();

    await page.goto(`/admin/productos?q=${encodeURIComponent(producto.name)}`);
    const sw = page.getByRole("switch", { name: `Mostrar ${producto.name} en la tienda` });
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await sw.click();
    await expect(aviso(page, `${producto.name} quedó pausado y ya no se ve en la tienda.`)).toBeVisible();
    await expect(sw).toHaveAttribute("aria-checked", "false");

    const tienda = await page.context().newPage();
    await tienda.goto("/tienda");
    await expect(tienda.getByText(producto.name)).toHaveCount(0);

    await page.getByRole("button", { name: "Deshacer" }).click();
    await expect(aviso(page, `${producto.name} vuelve a estar en la tienda.`)).toBeVisible();
    await tienda.reload();
    await expect(tienda.getByText(producto.name).first()).toBeVisible();
    await tienda.close();
  });

  test("no deja destacar más de 4", async ({ page }) => {
    // Se completan los 4 directo en la base: por la API, otro test que sume
    // un destacado en paralelo haría fallar la creación con 409.
    const { count } = await admin().from("productos").select("id", { count: "exact", head: true }).eq("destacado", true).eq("activo", true);
    for (let i = count ?? 0; i < 4; i++) await crearProductoDePrueba({ featured: true });
    const quinto = await crearProducto(page.request);

    await page.goto(`/admin/productos?q=${encodeURIComponent(quinto.name)}`);
    const estrella = page.getByRole("button", { name: `Destacar ${quinto.name} en el inicio` });
    await estrella.click();
    await expect(aviso(page, "Ya hay 4 destacados. Sacá uno antes de sumar otro.")).toBeVisible();
    await expect(estrella).toHaveAttribute("aria-pressed", "false");
  });

  test("valida en el navegador y lleva el foco al primer error", async ({ page }) => {
    await page.goto("/admin/productos/nuevo");
    await page.getByRole("button", { name: "Guardar cambios" }).first().click();
    const nombreInput = page.getByRole("textbox", { name: "Nombre" });
    await expect(nombreInput).toBeFocused();
    await expect(nombreInput).toHaveAttribute("aria-invalid", "true");
  });

  test("crea un producto con foto (webp de hasta 1600 px) y lo borra", async ({ page }) => {
    const name = nombre("Con foto");
    await page.goto("/admin/productos/nuevo");
    await page.getByRole("textbox", { name: "Nombre" }).fill(name);
    await page.getByRole("combobox", { name: "Categoría" }).selectOption({ label: "Budines" });
    await page.getByRole("textbox", { name: "Tamaño 1" }).fill("Único");
    await page.getByRole("textbox", { name: "Precio 1" }).fill("8.500");
    await page.getByRole("button", { name: "Guardar cambios" }).first().click();

    await page.waitForURL(/\/admin\/productos\/[0-9a-f-]{36}\?creado=1/);
    await expect(aviso(page, "Producto creado. Ahora podés sumarle fotos.")).toBeVisible();
    const id = page.url().match(/productos\/([0-9a-f-]{36})/)![1];

    // Una foto grande (3000 × 2000): el navegador la achica y el servidor la pasa a webp de 1600 px.
    const foto = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#a88b6c" } }).jpeg().toBuffer();
    await page.locator('input[type="file"]').setInputFiles({ name: "torta.jpg", mimeType: "image/jpeg", buffer: foto });
    await page.getByRole("button", { name: "Subir la foto", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Descripción de la foto" })).toBeFocused();
    await page.getByRole("textbox", { name: "Descripción de la foto" }).fill("Budín de prueba entero, visto de arriba");
    await page.getByRole("button", { name: "Subir la foto", exact: true }).click();
    await expect(page.getByRole("img", { name: "Budín de prueba entero, visto de arriba" })).toBeVisible();

    const { data } = await (await page.request.get(`/api/v1/admin/productos/${id}`)).json();
    expect(data.images).toHaveLength(1);
    expect(data.images[0]).toMatchObject({ cover: true, width: 1600, height: 1067 });
    expect(data.images[0].path).toMatch(/\.webp$/);

    await page.getByRole("button", { name: "Eliminar producto" }).click();
    const dialogo = page.getByRole("dialog", { name: `¿Borrar ${name}?` });
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByRole("button", { name: "Pausarlo en su lugar" })).toBeFocused();
    await dialogo.getByRole("button", { name: "Borrar definitivamente" }).click();
    await page.waitForURL(/\/admin\/productos\?borrado=/);
    await expect(aviso(page, `${name} se borró.`)).toBeVisible();
    expect((await page.request.get(`/api/v1/admin/productos/${id}`)).status()).toBe(404);
  });
});

test.describe("Workshops e inscripciones", () => {
  test("crea un workshop, ve a la inscripta y le cambia el estado", async ({ page }) => {
    const name = nombre("Workshop");
    const fecha = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await page.goto("/admin/workshops/nuevo");
    await page.getByRole("textbox", { name: "Nombre" }).fill(name);
    await page.getByLabel("Fecha", { exact: true }).fill(fecha);
    await page.getByLabel("Hora de inicio").fill("15:30");
    await page.getByRole("textbox", { name: "Precio por persona" }).fill("30.000");
    await page.getByRole("button", { name: "Un lugar menos" }).click(); // 8 → 7
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await page.waitForURL(/\/admin\/workshops\/[0-9a-f-]{36}\?tab=datos&creado=1/);
    const id = page.url().match(/workshops\/([0-9a-f-]{36})/)![1];
    const { data: workshop } = await (await page.request.get(`/api/v1/admin/workshops/${id}`)).json();
    // 15:30 de Buenos Aires = 18:30 UTC.
    expect(new Date(workshop.startsAt).toISOString()).toBe(`${fecha}T18:30:00.000Z`);
    expect(workshop).toMatchObject({ capacity: 7, price: 30000, active: true });

    // Una persona se inscribe desde la web (Mercado Pago es el mock de los e2e).
    const inscripcion = await page.request.post("/api/v1/inscripciones", {
      data: { workshopSlug: workshop.slug, name: "Ana Prueba", whatsapp: "11 5555-6666", email: "ana@ejemplo.com", acceptsPolicy: true, spots: 2 },
    });
    expect(inscripcion.status()).toBe(201);
    const { data: insc } = await inscripcion.json();

    await page.goto(`/admin/workshops/${id}`);
    await expect(page.getByRole("tab", { name: /Inscriptas \(1\)/ })).toHaveAttribute("aria-selected", "true");
    const fila = page.getByTestId(`inscripcion-${insc.id}`);
    await expect(fila).toContainText("Ana Prueba");
    await expect(fila.getByRole("link", { name: "Escribirle a Ana Prueba por WhatsApp" })).toHaveAttribute("href", /wa\.me\/5491155556666/);

    await fila.getByRole("combobox", { name: "Estado de la inscripción de Ana Prueba" }).selectOption("reservada");
    await expect(aviso(page, "Estado de Ana Prueba actualizado.")).toBeVisible();
    const { data: db } = await admin().from("inscripciones").select("estado").eq("id", insc.id).single();
    expect(db?.estado).toBe("reservada");

    // La pestaña Datos con el teclado.
    await page.getByRole("tab", { name: /Inscriptas/ }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Datos" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("textbox", { name: "Nombre" })).toHaveValue(name);
  });

  test("marca un pago como devuelto, y un aviso repetido no lo vuelve a marcar", async ({ page, workshop }) => {
    const response = await page.request.post("/api/v1/inscripciones", {
      data: { workshopSlug: workshop.slug, name: "Bea Prueba", whatsapp: "11 5555-6666", email: "bea@ejemplo.com", acceptsPolicy: true, spots: 1 },
    });
    const { data: insc } = await response.json();
    const pagoId = nuevoPagoId();
    // Monto distinto: no reserva y queda para devolver.
    await cargarPago(page.request, pagoId, { status: "approved", external_reference: insc.id, transaction_amount: 1 });
    expect((await avisarPago(page.request, pagoId)).status()).toBe(200);

    await page.goto("/admin/inscripciones");
    const item = page.getByTestId(`devolucion-${pagoId}`);
    await item.getByRole("button", { name: "Marcar como devuelto el pago de Bea Prueba" }).click();
    const dialogo = page.getByRole("dialog", { name: "¿Ya hiciste la devolución?" });
    await dialogo.getByRole("button", { name: "Sí, ya la devolví" }).click();
    await expect(aviso(page, "Marcado como devuelto.")).toBeVisible();
    await expect(item).toHaveCount(0);

    const leer = async () =>
      (await admin().from("pagos").select("devolucion_pendiente, devuelto_at").eq("mp_payment_id", pagoId).single()).data;
    expect(await leer()).toMatchObject({ devolucion_pendiente: false });
    expect((await leer())?.devuelto_at).toBeTruthy();

    // MP repite el aviso: sigue devuelto.
    expect((await avisarPago(page.request, pagoId)).status()).toBe(200);
    expect(await leer()).toMatchObject({ devolucion_pendiente: false });
  });
});
