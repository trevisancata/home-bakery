import type { Page } from "@playwright/test";
import { type Etapa, leerPedido, pedidoEn, sesionDe, tamanosDe, vencerPedido } from "./support/pedidos";
import { borrarProductoDePrueba, crearProductoDePrueba } from "./support/productos";
import { expect, hasSupabase, skipReason, test as base } from "./support/supabase";
import { authFile } from "./support/usuarios";

// Panel de pedidos con la admin de prueba. Cada test crea su producto
// ("e2e-…") y sus pedidos ("e2e-pedido-…"); el teardown borra los que queden.
// Se comprueban los pedidos propios por número, nunca los totales.

base.skip(!hasSupabase, skipReason);
base.use({ storageState: authFile.admin });

type Producto = { id: string; items: { productId: string; sizeId: string; quantity: number }[] };

const test = base.extend<{ producto: Producto }>({
  producto: async ({}, provide) => {
    const producto = await crearProductoDePrueba({ sizes: [{ label: "Único", price: 12000 }] });
    const [tamano] = await tamanosDe(producto.id);
    await provide({ id: producto.id, items: [{ productId: producto.id, sizeId: tamano.id, quantity: 2 }] });
    await borrarProductoDePrueba(producto.id);
  },
});

const aviso = (page: Page, texto: string | RegExp) => page.getByText(texto).filter({ visible: true });
const tarjeta = (page: Page, numero: number) => page.getByTestId(`pedido-${numero}`);

type Medio = "mercadopago" | "transferencia" | "efectivo";
const crear = (request: Parameters<typeof pedidoEn>[0], producto: Producto, medio: Medio, etapa: Etapa = "pendiente") =>
  pedidoEn(request, producto.items, { medio, etapa });

async function abrirDetalle(page: Page, id: string) {
  await page.goto(`/admin/pedidos/${id}`);
  await expect(page.getByRole("heading", { level: 1, name: /^Pedido #\d+$/ })).toBeVisible();
}

test.describe("Lista de pedidos", () => {
  test("cada pedido aparece en su pestaña, con la transferencia vencida marcada", async ({ page, request, producto }) => {
    const porConfirmar = await crear(request, producto, "mercadopago", "pagado");
    const efectivo = await crear(request, producto, "efectivo");
    const transferencia = await crear(request, producto, "transferencia");
    const vencida = await crear(request, producto, "transferencia");
    await vencerPedido(vencida.id);
    const enCurso = await crear(request, producto, "mercadopago", "aceptado");
    // De antes de 0011: quedó en en_preparacion y sigue en curso.
    const enPreparacion = await crear(request, producto, "mercadopago", "en_preparacion");
    const entregado = await crear(request, producto, "efectivo", "entregado");
    const rechazado = await crear(request, producto, "transferencia", "pagado");
    expect((await (await sesionDe("admin")).rpc("rechazar_pedido", { p_id: rechazado.id, p_motivo: "Prueba" })).error).toBeNull();

    const casos: [string, number[], number[]][] = [
      ["Esperando transferencia", [transferencia.numero, vencida.numero], [porConfirmar.numero]],
      ["Por confirmar", [porConfirmar.numero, efectivo.numero], [transferencia.numero]],
      ["En curso", [enCurso.numero, enPreparacion.numero], [entregado.numero]],
      ["Entregados y cancelados", [entregado.numero, rechazado.numero], [enCurso.numero]],
    ];
    await page.goto("/admin/pedidos");
    const nombres = await page.getByRole("navigation", { name: "Etapas de los pedidos" }).getByRole("link").allTextContents();
    expect(nombres.map((n) => n.replace(/ \(\d+\)$/, ""))).toEqual(casos.map(([pestana]) => pestana));
    for (const [pestana, estan, noEstan] of casos) {
      await page.getByRole("link", { name: new RegExp(`^${pestana} \\(\\d+\\)$`) }).click();
      await expect(page.getByRole("link", { name: new RegExp(`^${pestana} `) })).toHaveAttribute("aria-current", "page");
      for (const numero of estan) await expect(tarjeta(page, numero)).toBeVisible();
      for (const numero of noEstan) await expect(tarjeta(page, numero)).toHaveCount(0);
    }

    await page.goto("/admin/pedidos?tab=esperando_transferencia");
    await expect(tarjeta(page, vencida.numero)).toContainText("Vencida");
    await expect(tarjeta(page, vencida.numero)).toContainText("Transferencia · vencida, sin registrar");
    await expect(tarjeta(page, transferencia.numero)).toContainText(/Transferencia · esperando, vence \d{2}\/\d{2} \d{2}:\d{2} h/);
    await expect(tarjeta(page, transferencia.numero)).toContainText("2 productos");
  });

  test("el Inicio muestra los pedidos por confirmar y las transferencias, con link a cada pestaña", async ({ page, request, producto }) => {
    const pedido = await crear(request, producto, "mercadopago", "pagado");
    await page.goto("/admin");
    const tarjetaInicio = page.getByRole("region", { name: "Pedidos por confirmar" });
    await expect(tarjetaInicio.getByTestId("inicio-por-confirmar-cantidad")).toHaveText(/^\d+ pedidos?$/);
    await tarjetaInicio.getByRole("link", { name: "Ver pedidos por confirmar" }).click();
    await expect(page).toHaveURL(/\/admin\/pedidos\?tab=por_confirmar$/);
    await expect(tarjeta(page, pedido.numero)).toBeVisible();
    await page.goto("/admin");
    await expect(page.getByRole("region", { name: "Transferencias esperando" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Entregas de hoy" })).toBeVisible();
  });
});

test.describe("Detalle y acciones", () => {
  test("aceptar un pedido de Mercado Pago y avisar por WhatsApp con el día y la franja", async ({ page, request, producto }) => {
    const pedido = await crear(request, producto, "mercadopago", "pagado");
    await abrirDetalle(page, pedido.id);
    await expect(page.getByRole("heading", { name: "Productos" })).toBeVisible();
    await expect(page.getByText("2 × ")).toBeVisible();
    await page.getByRole("button", { name: "Aceptar pedido" }).click();
    await expect(aviso(page, `Aceptaste el pedido #${pedido.numero}.`)).toBeVisible();
    await expect(page.locator("#pedido-estado")).toBeFocused();
    await expect(page.locator("#pedido-estado")).toContainText("Aceptado");
    expect((await leerPedido(pedido.id)).estado).toBe("aceptado");

    const href = await page.getByRole("link", { name: /^Avisar que lo confirmé/ }).getAttribute("href");
    const texto = new URL(href!).searchParams.get("text")!;
    expect(texto).toContain(`#${pedido.numero}`);
    expect(texto).toMatch(/\d+ a \d+ h/);
  });

  test("rechazar pide el motivo, enfoca Volver y deja el pago de MP en Para devolver", async ({ page, request, producto }) => {
    const pedido = await crear(request, producto, "mercadopago", "pagado");
    await abrirDetalle(page, pedido.id);
    await page.getByRole("button", { name: "Rechazar" }).click();
    const dialogo = page.getByRole("dialog", { name: "¿Rechazar el pedido?" });
    await expect(dialogo.getByRole("button", { name: "Volver" })).toBeFocused();
    await dialogo.getByRole("button", { name: "Rechazar pedido" }).click();
    await expect(dialogo.getByText("Escribí el motivo (al menos 3 letras).")).toBeVisible();
    await expect(dialogo.getByRole("textbox", { name: "Motivo *" })).toBeFocused();

    await dialogo.getByRole("textbox", { name: "Motivo *" }).fill("No llego con la fecha");
    await dialogo.getByRole("button", { name: "Rechazar pedido" }).click();
    await expect(aviso(page, `Rechazaste el pedido #${pedido.numero}. Estaba pagado: quedó en Para devolver.`)).toBeVisible();
    await expect(page.getByText("Motivo del rechazo: No llego con la fecha")).toBeVisible();

    await page.goto("/admin/inscripciones#para-devolver");
    const item = page.getByTestId(`devolucion-${pedido.pagoId}`);
    await expect(item).toContainText(`Pedido #${pedido.numero}`);
    await expect(item).toContainText("Pedido rechazado");
    await page.goto("/admin");
    await expect(page.getByRole("region", { name: "Para devolver" })).toContainText(`Pedido #${pedido.numero}`);
  });

  test("registrar una transferencia vencida avisa de la fecha; el efectivo se acepta sin cobrar", async ({ page, request, producto }) => {
    const transferencia = await crear(request, producto, "transferencia");
    await vencerPedido(transferencia.id);
    await abrirDetalle(page, transferencia.id);
    await expect(page.getByRole("button", { name: "Aceptar pedido" })).toHaveCount(0);
    await page.getByRole("button", { name: "Ya recibí la transferencia" }).click();
    const dialogo = page.getByRole("dialog", { name: "¿Registrar el pago?" });
    await expect(dialogo).toContainText("Esta transferencia venció");
    await expect(dialogo.getByRole("button", { name: "Todavía no" })).toBeFocused();
    await dialogo.getByRole("button", { name: "Sí, registrar el pago" }).click();
    await expect(aviso(page, `Registraste el pago del pedido #${transferencia.numero}.`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Aceptar pedido" })).toBeVisible();
    expect((await leerPedido(transferencia.id)).estado).toBe("pagado");

    const efectivo = await crear(request, producto, "efectivo");
    await abrirDetalle(page, efectivo.id);
    await page.getByRole("button", { name: "Aceptar pedido" }).click();
    await expect(page.locator("#pedido-estado")).toContainText("Efectivo · a cobrar al retirar");
  });

  test("los links viejos a Entregados y a Rechazados llevan a Entregados y cancelados", async ({ page }) => {
    for (const tab of ["entregados", "rechazados"]) {
      await page.goto(`/admin/pedidos?tab=${tab}`);
      await expect(page.getByRole("heading", { level: 2, name: "Entregados y cancelados" })).toBeVisible();
    }
  });

  test("en curso: avisar que está listo no cambia el estado; en efectivo sin cobrar queda entregado y cobrado", async ({ page, request, producto }) => {
    const pedido = await crear(request, producto, "efectivo", "aceptado");
    await abrirDetalle(page, pedido.id);
    const acciones = page.getByRole("region", { name: "Qué sigue" });
    await expect(acciones.getByRole("button", { name: "Empezar a preparar" })).toHaveCount(0);
    await expect(acciones.getByRole("button", { name: /^Listo/ })).toHaveCount(0);
    await expect(acciones.getByRole("button", { name: "Cancelar pedido" })).toBeVisible();
    const href = await acciones.getByRole("link", { name: /^Avisar que está listo/ }).getAttribute("href");
    expect(new URL(href!).searchParams.get("text")).toContain("listo para retirar");
    expect((await leerPedido(pedido.id)).estado).toBe("aceptado");

    await page.getByRole("button", { name: "Entregado y cobrado" }).click();
    const dialogo = page.getByRole("dialog", { name: "¿Ya lo entregaste?" });
    await expect(dialogo).toContainText("todavía no está cobrado");
    await dialogo.getByRole("button", { name: "Entregado y cobrado" }).click();
    await expect(page.locator("#pedido-estado")).toContainText("Entregado");
    expect(await leerPedido(pedido.id)).toMatchObject({ estado: "entregado", pagado_at: expect.any(String) });
    await expect(page.getByText("No hay nada para hacer con este pedido.")).toBeVisible();
  });

  test("un pedido que quedó en Listo (antes de 0011) se marca entregado", async ({ page, request, producto }) => {
    const pedido = await crear(request, producto, "mercadopago", "listo");
    await abrirDetalle(page, pedido.id);
    await page.getByRole("button", { name: "Entregado" }).click();
    const dialogo = page.getByRole("dialog", { name: "¿Ya lo entregaste?" });
    await expect(dialogo).toContainText("El pedido pasa a Entregados y cancelados.");
    await dialogo.getByRole("button", { name: "Sí, entregado" }).click();
    await expect(aviso(page, `El pedido #${pedido.numero} pasó a entregado.`)).toBeVisible();
    expect((await leerPedido(pedido.id)).estado).toBe("entregado");
  });

  test("cancelar un pedido aceptado con motivo; la transferencia queda para devolver y se marca devuelta", async ({ page, request, producto }) => {
    const pedido = await crear(request, producto, "transferencia", "aceptado");
    await abrirDetalle(page, pedido.id);
    await page.getByRole("button", { name: "Cancelar pedido" }).click();
    const dialogo = page.getByRole("dialog", { name: "¿Cancelar el pedido?" });
    await expect(dialogo.getByRole("button", { name: "Volver" })).toBeFocused();
    await dialogo.getByRole("textbox", { name: "Motivo *" }).fill("La clienta no puede");
    await dialogo.getByRole("button", { name: "Cancelar pedido" }).click();
    await expect(aviso(page, `Cancelaste el pedido #${pedido.numero}. Estaba pagado: quedó en Para devolver.`)).toBeVisible();
    await expect(page.locator("#pedido-estado")).toContainText("Transferencia · para devolver");
    const href = await page.getByRole("link", { name: /^Avisar por WhatsApp/ }).getAttribute("href");
    expect(new URL(href!).searchParams.get("text")).toContain("La clienta no puede");

    await page.getByRole("button", { name: "Ya hice la devolución" }).click();
    await expect(aviso(page, "Marcado como devuelto.")).toBeVisible();
    expect(await leerPedido(pedido.id)).toMatchObject({ estado: "cancelado", devolucion_pendiente: false, devuelto_at: expect.any(String) });
  });
});

test.describe("En el celular (390 px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("la lista y el detalle entran sin scroll horizontal y los botones miden al menos 44 px", async ({ page, request, producto }) => {
    const pedido = await pedidoEn(request, producto.items, {
      medio: "transferencia",
      datos: { delivery: "retiro", notes: "Es para un cumpleaños, con una vela." },
    });
    const sinScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

    await page.goto("/admin/pedidos?tab=esperando_transferencia");
    await expect(tarjeta(page, pedido.numero)).toBeVisible();
    expect(await sinScroll()).toBe(true);
    await expect(page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "Pedidos" })).toHaveAttribute("aria-current", "page");

    await tarjeta(page, pedido.numero).getByRole("link").click();
    await expect(page.getByRole("heading", { level: 1, name: `Pedido #${pedido.numero}` })).toBeVisible();
    expect(await sinScroll()).toBe(true);
    for (const boton of await page.getByRole("region", { name: "Qué sigue" }).getByRole("button").all()) {
      expect((await boton.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole("button", { name: "Rechazar" }).click();
    const dialogo = page.getByRole("dialog", { name: "¿Rechazar el pedido?" });
    const caja = (await dialogo.boundingBox())!;
    expect(caja.width).toBeLessThanOrEqual(390);
    await dialogo.getByRole("button", { name: "Volver" }).click();
    await expect(dialogo).toBeHidden();
  });
});
