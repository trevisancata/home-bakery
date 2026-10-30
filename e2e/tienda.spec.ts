import type { Page } from "@playwright/test";
import { currentMonth, seasonRange } from "../lib/temporada";
import {
  borrarProductoDePrueba,
  borrarProductoPorApi,
  crearProductoDePrueba,
  crearProductoPorApi,
  nombreDePrueba,
  type TestProducto,
} from "./support/productos";
import { abrirHastaVer, test as base, expect, hasSupabase, skipReason } from "./support/supabase";
import { authFile } from "./support/usuarios";

// Cada test crea sus propios productos "e2e-…" y los borra al terminar: no
// depende del catálogo real, que Maggie edita desde el panel.

/**
 * Un budín y un postre de prueba en el listado de /tienda. Se crean con la
 * API de admin (sesión de la admin de prueba en un contexto aparte; la
 * página navega sin sesión), que revalida la tienda: es estática (ISR) y un
 * producto insertado directo en la base no aparecería hasta 5 minutos después.
 */
const test = base.extend<{ catalogo: { budin: TestProducto; postre: TestProducto } }>({
  catalogo: async ({ playwright, baseURL }, provide) => {
    const api = await playwright.request.newContext({ baseURL, storageState: authFile.admin });
    const creados: TestProducto[] = [];
    try {
      const budin = await crearProductoPorApi(api, { name: nombreDePrueba("Budín"), categoria: "budines" });
      creados.push(budin);
      const postre = await crearProductoPorApi(api, { name: nombreDePrueba("Postre"), categoria: "postres" });
      creados.push(postre);
      await provide({ budin, postre });
    } finally {
      for (const producto of creados) await borrarProductoPorApi(api, producto.id);
      await api.dispose();
    }
  },
});

test.skip(!hasSupabase, skipReason);

const catalogo = (page: Page) => page.getByRole("list", { name: /Todos los productos|Budines|Postres/ });

test.describe("Tienda", () => {
  test("filtra por categoría y lo refleja en la URL", async ({ page, catalogo: { budin, postre } }) => {
    await abrirHastaVer(page, "/tienda", () => catalogo(page).getByRole("link", { name: postre.name, exact: true }));
    await expect(page.getByRole("heading", { level: 2, name: "Todos los productos" })).toBeVisible();

    const filtros = page.getByRole("group", { name: "Filtrar por categoría" });
    await filtros.getByRole("button", { name: "Budines" }).click();

    await expect(page).toHaveURL(/\/tienda\?categoria=budines$/);
    await expect(filtros.getByRole("button", { name: "Budines" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { level: 2, name: "Budines" })).toBeVisible();
    await expect(catalogo(page).getByRole("link", { name: budin.name, exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: postre.name, exact: true })).toHaveCount(0);
    // La categoría de cada tarjeta (el eyebrow) es Budines.
    const categorias = await catalogo(page).locator("article > p:first-of-type").allTextContents();
    expect(new Set(categorias)).toEqual(new Set(["Budines"]));

    await filtros.getByRole("button", { name: "Todo" }).click();
    await expect(page).toHaveURL(/\/tienda$/);
  });

  test("entra directo a una categoría desde la URL", async ({ page, catalogo: { budin, postre } }) => {
    await abrirHastaVer(page, "/tienda?categoria=postres", () => catalogo(page).getByRole("link", { name: postre.name, exact: true }));
    await expect(page.getByRole("heading", { level: 2, name: "Postres" })).toBeVisible();
    await expect(page.getByRole("link", { name: budin.name, exact: true })).toHaveCount(0);
  });

  test("muestra un estado vacío si la categoría no existe", async ({ page }) => {
    await page.goto("/tienda?categoria=inexistente");
    await expect(page.getByText("No hay productos en esta categoría.")).toBeVisible();
    await page.getByRole("button", { name: "Ver todo" }).click();
    await expect(page).toHaveURL(/\/tienda$/);
  });

  test("abre el detalle de un producto desde la tarjeta", async ({ page, catalogo: { budin } }) => {
    await abrirHastaVer(page, "/tienda?categoria=budines", () => page.getByRole("link", { name: budin.name, exact: true }));
    await page.getByRole("link", { name: budin.name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/tienda/${budin.slug}$`));
    await expect(page.getByRole("heading", { level: 1, name: budin.name })).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(budin.name));
  });

  test("detalle con precio a confirmar y temporada", async ({ page }) => {
    // La temporada arranca este mes, así el producto está en temporada.
    const desde = currentMonth();
    const season = { from: desde, to: (desde % 12) + 1 };
    const producto = await crearProductoDePrueba({
      sizes: [{ label: "Único", price: null }],
      medida: "24 cm de diámetro",
      season,
    });
    try {
      await page.goto(`/tienda/${producto.slug}`);
      await expect(page.getByRole("heading", { level: 1, name: producto.name })).toBeVisible();
      await expect(page.getByText("Precio a confirmar")).toBeVisible();
      await expect(page.getByText(`Solo en temporada: ${seasonRange(season)}`)).toBeVisible();
      await expect(page.getByText("24 cm de diámetro")).toBeVisible();
    } finally {
      await borrarProductoDePrueba(producto.id);
    }
  });

  test("un producto a medida se consulta por WhatsApp", async ({ page }) => {
    const producto = await crearProductoDePrueba({
      name: nombreDePrueba("A medida"),
      categoria: "number-cakes",
      custom: true,
      flavors: ["Vainilla", "Chocolate"],
      sizes: [{ label: "Número de 1 cifra", price: null }],
    });
    try {
      await page.goto(`/tienda/${producto.slug}`);
      const whatsapp = page.getByRole("link", { name: "Consultar por WhatsApp" });
      const href = await whatsapp.getAttribute("href");
      expect(href).toMatch(/^https:\/\/wa\.me\//);
      expect(new URL(href!).searchParams.get("text")).toContain(producto.name);
      await expect(page.getByRole("heading", { level: 2, name: "Sabores" })).toBeVisible();
      await expect(page.getByText("Vainilla")).toBeVisible();
    } finally {
      await borrarProductoDePrueba(producto.id);
    }
  });

  test("un producto oculto da 404", async ({ page }) => {
    const producto = await crearProductoDePrueba({ active: false });
    try {
      const response = await page.goto(`/tienda/${producto.slug}`);
      expect(response?.status()).toBe(404);
    } finally {
      await borrarProductoDePrueba(producto.id);
    }
  });
});
