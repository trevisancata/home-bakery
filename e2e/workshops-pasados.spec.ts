import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { sesionDe } from "./support/pedidos";
import {
  abrirHastaNoVer,
  abrirHastaVer,
  admin,
  borrarWorkshopsDePrueba,
  crearWorkshopPasadoDePrueba,
  expect,
  hasSupabase,
  skipReason,
  test,
} from "./support/supabase";
import { authFile } from "./support/usuarios";

// "Así fueron los workshops" en /workshops: sale de la base (workshops_pasados,
// 0010). Los workshops de prueba son "e2e-pasado-…" y los borra el teardown.
// En serie: el primer test necesita que todavía no haya fotos de prueba.

test.skip(!hasSupabase, skipReason);
test.describe.configure({ mode: "serial" });

const max = 9;

/** Cliente con la clave publishable, como cualquier visitante. */
const publica = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });

/** "Noviembre 2026", igual que formatMonthYear (hora de Buenos Aires). */
function mesYAnio(iso: string) {
  const opciones = { timeZone: "America/Argentina/Buenos_Aires" } as const;
  const mes = new Intl.DateTimeFormat("es-AR", { ...opciones, month: "long" }).format(new Date(iso));
  const anio = new Intl.DateTimeFormat("es-AR", { ...opciones, year: "numeric" }).format(new Date(iso));
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${anio}`;
}

const creados: string[] = [];
test.afterAll(async () => {
  await borrarWorkshopsDePrueba(creados);
});

async function pasado(opciones: Parameters<typeof crearWorkshopPasadoDePrueba>[0]) {
  const w = await crearWorkshopPasadoDePrueba(opciones);
  creados.push(w.id);
  return w;
}

test("sin fotos, la sección no aparece (quedan Instagram y el workshop personalizado)", async ({ page }) => {
  const { data, error } = await publica().rpc("workshops_pasados", { p_limite: max });
  expect(error).toBeNull();
  test.skip(data!.length > 0, "La base ya tiene workshops pasados con foto: no se puede probar la sección vacía.");

  await page.goto("/workshops");
  await expect(page.getByRole("heading", { name: /Así fueron/ })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Workshops anteriores" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Ver más en Instagram/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Workshop personalizado" })).toBeVisible();
});

test("la función pública devuelve solo nombre, fecha y foto, sin inscripciones", async () => {
  // Viejo, para que no entre entre los últimos 9 del test del panel.
  const w = await pasado({ diasAtras: 400, conFoto: true });
  const { data, error } = await publica().rpc("workshops_pasados", { p_limite: 50 });
  expect(error).toBeNull();
  const fila = (data as Record<string, unknown>[]).find((row) => row.nombre === w.name);
  expect(fila).toBeDefined();
  expect(Object.keys(fila!).sort()).toEqual(["fecha_inicio", "foto_alt", "foto_ruta", "nombre"]);

  // Las inscripciones siguen sin poder leerse con la clave publishable.
  const inscripciones = await publica().from("inscripciones").select("id").limit(1);
  expect(inscripciones.data ?? []).toHaveLength(0);
  // Y el tope de la función: nunca más de 50, ni con un número negativo.
  expect((await publica().rpc("workshops_pasados", { p_limite: -1 })).data).toEqual([]);
});

test("subir o quitar la foto sin rol o sin sesión responde 42501", async () => {
  const w = await pasado({});
  for (const client of [await sesionDe("sinRol"), publica()]) {
    const poner = await client.rpc("poner_foto_recuerdo", { p_workshop_id: w.id, p_ruta: `${w.slug}/x.webp`, p_alt: "Foto" });
    expect(poner.error?.code).toBe("42501");
    expect((await client.rpc("quitar_foto_recuerdo", { p_workshop_id: w.id })).error?.code).toBe("42501");
  }
  const { data } = await admin().from("workshops").select("foto_recuerdo_ruta").eq("id", w.id).single();
  expect(data!.foto_recuerdo_ruta).toBeNull();
});

test("un workshop futuro o de ejemplo no acepta foto de cómo fue (HB409)", async () => {
  const futuro = await pasado({ diasAtras: -30 });
  const ejemplo = await pasado({ esEjemplo: true });
  const client = await sesionDe("admin");
  for (const w of [futuro, ejemplo]) {
    const poner = await client.rpc("poner_foto_recuerdo", { p_workshop_id: w.id, p_ruta: `${w.slug}/x.webp`, p_alt: "Foto" });
    expect(poner.error?.code).toBe("HB409");
  }
});

test.describe("con la admin", () => {
  test.use({ storageState: authFile.admin });

  test("sube la foto desde el panel, aparece en el sitio (con tope de 9) y desaparece al quitarla", async ({ page }) => {
    // Diez pasados con foto (de hace 2 a 11 días), uno de ejemplo y uno futuro,
    // cargados directo en la base: se ven en el sitio recién cuando el panel revalida.
    const otros = [];
    for (let dias = 2; dias <= 11; dias++) otros.push(await pasado({ diasAtras: dias, conFoto: true }));
    const ejemplo = await pasado({ diasAtras: 1, esEjemplo: true, conFoto: true });
    const futuro = await pasado({ diasAtras: -10, conFoto: true });
    // El de ayer (a la mañana), sin foto: es el que sube la admin.
    const w = await pasado({ diasAtras: 0.5, name: `E2E Pasado panel ${Math.random().toString(36).slice(2, 7)}` });

    await page.goto(`/admin/workshops/${w.id}`);
    const seccion = page.getByRole("region", { name: "Foto de cómo fue" });
    await expect(seccion.getByText("Sin foto: no aparece en el sitio.")).toBeVisible();

    const foto = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#a88b6c" } }).jpeg().toBuffer();
    await seccion.locator('input[type="file"]').setInputFiles({ name: "workshop.jpg", mimeType: "image/jpeg", buffer: foto });
    // Sin descripción, no sube.
    await seccion.getByRole("button", { name: "Subir la foto", exact: true }).click();
    await expect(seccion.getByRole("textbox", { name: "Descripción de la foto" })).toBeFocused();
    await expect(seccion.getByRole("alert")).toContainText("Obligatorio");

    const alt = "Las alumnas con sus postres en la mesada";
    await seccion.getByRole("textbox", { name: "Descripción de la foto" }).fill(alt);
    await seccion.getByRole("button", { name: "Subir la foto", exact: true }).click();
    await expect(seccion.getByRole("img", { name: alt })).toBeVisible();
    await expect(seccion.getByText("Aparece en el sitio")).toBeVisible();

    const { data: fila } = await admin().from("workshops").select("foto_recuerdo_ruta, foto_recuerdo_alt").eq("id", w.id).single();
    expect(fila!.foto_recuerdo_ruta).toMatch(new RegExp(`^${w.slug}/recuerdo-.+\\.webp$`));
    expect(fila!.foto_recuerdo_alt).toBe(alt);

    // En el sitio: el más reciente primero, con "Mes 2026", y solo los últimos 9.
    const lista = (p: typeof page) => p.getByRole("region", { name: "Workshops anteriores" });
    await abrirHastaVer(page, "/workshops", (p) => lista(p).getByRole("heading", { name: w.name }));
    await expect(page.getByRole("heading", { name: /Así fueron/ })).toBeVisible();
    const items = lista(page).getByRole("listitem");
    await expect(items).toHaveCount(max);
    await expect(items.first().getByRole("heading")).toHaveText(w.name);
    await expect(items.first()).toContainText(mesYAnio(w.startsAt));
    await expect(items.first().getByRole("img", { name: alt })).toBeVisible();
    for (const [i, otro] of otros.slice(0, max - 1).entries()) {
      await expect(items.nth(i + 1).getByRole("heading")).toHaveText(otro.name);
    }
    for (const fuera of [otros[max - 1], otros[max], ejemplo, futuro]) {
      await expect(lista(page).getByRole("heading", { name: fuera.name })).toHaveCount(0);
    }

    // Quitar la foto, con confirmación.
    await page.goto(`/admin/workshops/${w.id}`);
    await seccion.getByRole("button", { name: "Quitar foto" }).click();
    const dialogo = page.getByRole("dialog", { name: "¿Quitar la foto de cómo fue?" });
    await expect(dialogo.getByRole("button", { name: "Cancelar" })).toBeFocused();
    await dialogo.getByRole("button", { name: "Quitar foto" }).click();
    await expect(seccion.getByText("Sin foto: no aparece en el sitio.")).toBeVisible();
    const { data: sinFoto } = await admin().from("workshops").select("foto_recuerdo_ruta").eq("id", w.id).single();
    expect(sinFoto!.foto_recuerdo_ruta).toBeNull();

    // Desaparece y entra el que había quedado afuera.
    await abrirHastaNoVer(page, "/workshops", (p) => lista(p).getByRole("heading", { name: w.name }));
    await expect(lista(page).getByRole("heading", { name: otros[max - 1].name })).toBeVisible();
    await expect(lista(page).getByRole("listitem")).toHaveCount(max);
  });
});
