import type { Page } from "@playwright/test";
import { claveCarrito } from "../lib/carrito/lineas";
import { avisarPago, cargarPago, nuevoPagoId } from "./support/pagos";
import { domingo, emailDePedido, leerPedido, pedir, tamanosDe, turnoValido } from "./support/pedidos";
import { borrarProductoDePrueba, crearProductoDePrueba, type TestProducto } from "./support/productos";
import { admin, expect, hasSupabase, skipReason, test as base } from "./support/supabase";

// El carrito y el checkout en el navegador, con el mock de Mercado Pago.
// Productos de prueba propios ("e2e-…"); los pedidos (email "e2e-pedido-…")
// los borra el teardown.

base.skip(!hasSupabase, skipReason);

type Budin = TestProducto & { chico: string; grande: string };

const test = base.extend<{ budin: Budin }>({
  budin: async ({}, provide) => {
    const producto = await crearProductoDePrueba({
      sizes: [
        { label: "Chico", price: 12000 },
        { label: "Grande", price: 450000 },
      ],
      flavors: ["Limón", "Naranja"],
      decorations: ["Flores"],
    });
    const [chico, grande] = await tamanosDe(producto.id);
    await provide({ ...producto, chico: chico.id, grande: grande.id });
    await borrarProductoDePrueba(producto.id);
  },
});

const carrito = (page: Page) => page.getByRole("link", { name: /^Carrito/ });

/** Agrega un producto desde su detalle, como lo haría alguien. */
async function agregar(page: Page, budin: Budin, { tamano = "Chico", sabor = "Limón", cantidad = 1 } = {}) {
  await page.goto(`/tienda/${budin.slug}`);
  await page.getByRole("radio", { name: new RegExp(tamano) }).check();
  await page.getByLabel("Sabor").selectOption(sabor);
  for (let i = 1; i < cantidad; i++) await page.getByRole("button", { name: "Uno más" }).click();
  await page.getByRole("button", { name: /Agregar al pedido/ }).click();
  await expect(page.getByText("¡Listo! Lo agregamos a tu pedido.")).toBeVisible();
}

async function completarDatos(page: Page, email: string) {
  await page.getByRole("textbox", { name: "Nombre y apellido" }).fill("Prueba E2E");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByRole("textbox", { name: "WhatsApp", exact: true }).fill("11 5555-6666");
  const { date, slot } = turnoValido();
  await page.getByRole("textbox", { name: "Día", exact: true }).fill(date);
  await page.getByRole("combobox", { name: "Horario", exact: true }).selectOption(slot);
}

/** El pedido que creó el checkout (por el email de prueba). */
async function pedidoDe(email: string) {
  const { data, error } = await admin().from("pedidos").select("id").eq("email", email).single();
  if (error) throw new Error(`No se encontró el pedido: ${error.message}`);
  return data.id as string;
}

test.describe("Carrito", () => {
  test("agregar con tamaño y sabor, ver el contador y editar en /carrito", async ({ page, budin }) => {
    await page.goto(`/tienda/${budin.slug}`);
    await expect(carrito(page)).toHaveAccessibleName("Carrito, vacío");
    // Sin sabor no se puede agregar.
    await page.getByRole("button", { name: /Agregar al pedido/ }).click();
    await expect(page.getByText("Elegí un sabor.")).toBeVisible();
    await expect(page.getByLabel("Sabor")).toBeFocused();

    await agregar(page, budin, { cantidad: 2 });
    await expect(carrito(page)).toHaveAccessibleName("Carrito, 2 productos");
    await expect(page.getByTestId("carrito-contador")).toHaveText("2");
    // El aviso del header (aria-live).
    await expect(page.getByText(`Agregaste ${budin.name} al pedido.`)).toBeAttached();

    await page.getByRole("link", { name: "Ver pedido" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Tu pedido" })).toBeVisible();
    await expect(page.getByTestId("carrito-linea")).toHaveCount(1);
    await expect(page.getByTestId("carrito-total")).toHaveText("$ 24.000");

    await page.getByRole("button", { name: `Uno más de ${budin.name}` }).click();
    await expect(page.getByTestId("carrito-total")).toHaveText("$ 36.000");
    await expect(carrito(page)).toHaveAccessibleName("Carrito, 3 productos");

    // Se mantiene al recargar (localStorage).
    await page.reload();
    await expect(page.getByTestId("carrito-total")).toHaveText("$ 36.000");

    await page.getByRole("button", { name: `Quitar ${budin.name} del pedido` }).click();
    await expect(page.getByText("Todavía no agregaste nada.")).toBeVisible();
    await expect(carrito(page)).toHaveAccessibleName("Carrito, vacío");
  });

  test("un producto que dejó de estar disponible se avisa y no deja seguir", async ({ page, budin }) => {
    await agregar(page, budin);
    await admin().from("productos").update({ activo: false }).eq("id", budin.id);
    await page.goto("/carrito");
    await expect(page.getByText("Este producto ya no está disponible. Quitalo para seguir.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();
  });

  test("si cambió el precio, se avisa y se actualiza", async ({ page, budin }) => {
    await agregar(page, budin);
    await admin().from("producto_tamanos").update({ precio: 13000 }).eq("id", budin.chico);
    await page.goto("/carrito");
    await expect(page.getByText("El precio cambió: antes $ 12.000, ahora $ 13.000.")).toBeVisible();
    await expect(page.getByTestId("carrito-total")).toHaveText("$ 13.000");
  });

  test("un carrito guardado roto se descarta", async ({ page }) => {
    await page.addInitScript((clave) => window.localStorage.setItem(clave, "{roto"), claveCarrito);
    await page.goto("/carrito");
    await expect(page.getByText("Todavía no agregaste nada.")).toBeVisible();
  });

  test("a medida: no se agrega, se consulta por WhatsApp", async ({ page }) => {
    const producto = await crearProductoDePrueba({ custom: true, sizes: [{ label: "Único", price: 50000 }] });
    try {
      await page.goto(`/tienda/${producto.slug}`);
      await expect(page.getByRole("button", { name: /Agregar al pedido/ })).toHaveCount(0);
      const href = await page.getByRole("link", { name: "Consultar por WhatsApp" }).getAttribute("href");
      expect(href).toMatch(/^https:\/\/wa\.me\//);
      expect(new URL(href!).searchParams.get("text")).toContain(producto.name);
    } finally {
      await borrarProductoDePrueba(producto.id);
    }
  });
});

test.describe("Checkout", () => {
  test("retiro → Mercado Pago → pagado: el carrito se vacía", async ({ page, request, budin }) => {
    await agregar(page, budin, { cantidad: 2 });
    await page.goto("/carrito");
    await page.getByRole("link", { name: "Continuar" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Finalizar pedido" })).toBeVisible();
    await expect(page.getByText("Maggie tiene que confirmar tu pedido")).toBeVisible();
    await expect(page.getByTestId("checkout-total")).toHaveText("$ 24.000");
    // Con $ 24.000 no hay envío.
    await expect(page.getByRole("radio", { name: /Envío a domicilio/ })).toBeDisabled();

    const email = emailDePedido();
    await completarDatos(page, email);
    await page.getByRole("button", { name: "Pagar con Mercado Pago" }).click();
    await expect(page.getByRole("heading", { name: "Checkout de prueba" })).toBeVisible();

    const id = await pedidoDe(email);
    expect(await leerPedido(id)).toMatchObject({ estado: "pendiente_pago", entrega: "retiro" });
    const pagoId = nuevoPagoId();
    await cargarPago(request, pagoId, { status: "approved", external_reference: `pedido:${id}`, transaction_amount: 24000 });
    await avisarPago(request, pagoId);

    await page.goto(`/pedido/resultado?pedido=${id}`);
    await expect(page.getByRole("heading", { level: 1, name: "¡Recibimos tu pago!" })).toBeVisible();
    await expect(page.getByText("Tu pedido está pagado y Maggie lo va a confirmar; te escribe por WhatsApp.")).toBeVisible();
    await expect(page.getByTestId("resultado-total")).toHaveText("$ 24.000");
    const { numero } = await leerPedido(id);
    const href = await page.getByRole("link", { name: /Escribirle a Maggie/ }).getAttribute("href");
    expect(new URL(href!).searchParams.get("text")).toContain(`#${numero}`);
    await expect(carrito(page)).toHaveAccessibleName("Carrito, vacío");
  });

  test("envío con total desde $ 400.000 y dirección", async ({ page, budin }) => {
    await agregar(page, budin, { tamano: "Grande" });
    await page.goto("/carrito/checkout");
    const email = emailDePedido();
    await completarDatos(page, email);
    await page.getByRole("radio", { name: /Envío a domicilio/ }).check();
    await expect(page.getByText("Por ahora el envío no tiene cargo.")).toBeVisible();
    // Sin dirección no se envía.
    await page.getByRole("button", { name: "Pagar con Mercado Pago" }).click();
    await expect(page.getByText("Ingresá la dirección.")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Dirección" })).toBeFocused();

    await page.getByRole("textbox", { name: "Dirección" }).fill("Calle de Prueba 123");
    await page.getByRole("textbox", { name: "Localidad" }).fill("San Isidro");
    await page.getByRole("button", { name: "Pagar con Mercado Pago" }).click();
    await expect(page.getByRole("heading", { name: "Checkout de prueba" })).toBeVisible();
    expect(await leerPedido(await pedidoDe(email))).toMatchObject({ entrega: "envio", direccion: "Calle de Prueba 123" });
  });

  test("un domingo avisa al elegirlo, sin esperar al envío", async ({ page, budin }) => {
    await agregar(page, budin);
    await page.goto("/carrito/checkout");
    await page.getByRole("textbox", { name: "Día", exact: true }).fill(domingo());
    await expect(page.getByText("Los domingos no hay retiros ni entregas. Elegí otro día.")).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Horario", exact: true })).toBeDisabled();
  });
});

test.describe("Resultado del pago", () => {
  test("rechazado: se puede probar de nuevo; pendiente: espera", async ({ page, request, budin }) => {
    const { body } = await pedir(request, [{ productId: budin.id, sizeId: budin.chico, flavor: "Limón", quantity: 1 }]);
    const id = body.data.id as string;

    await page.goto(`/pedido/resultado?pedido=${id}`);
    await expect(page.getByRole("heading", { level: 1, name: "Estamos esperando la confirmación del pago" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pagar", exact: true })).toHaveAttribute("href", body.data.initPoint);

    // La página concilia con MP aunque el webhook no llegue.
    await cargarPago(request, nuevoPagoId(), { status: "rejected", external_reference: `pedido:${id}`, transaction_amount: 12000 });
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "El pago no se aprobó" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Probar de nuevo" })).toHaveAttribute("href", body.data.initPoint);

    await cargarPago(request, nuevoPagoId(), { status: "in_process", external_reference: `pedido:${id}`, transaction_amount: 12000 });
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Estamos esperando la confirmación del pago" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pagar", exact: true })).toHaveCount(0);
  });

  test("un id que no es un pedido da 404", async ({ page }) => {
    const response = await page.goto("/pedido/resultado?pedido=no-es-un-uuid");
    expect(response?.status()).toBe(404);
  });
});
