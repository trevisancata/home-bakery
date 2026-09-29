/**
 * Compara el sitio con el mockup aprobado en docs/mockup/.
 *
 * Saca capturas de página completa del mockup (file://) y del sitio
 * (BASE_URL, por defecto http://localhost:3000) a 1440 y 390 px, y guarda
 * en docs/mockup/comparaciones/ una imagen con tres columnas:
 * mockup · sitio · diferencia.
 *
 * Uso:
 *   npm run compare              → todas las pantallas
 *   npm run compare -- tienda    → solo las pantallas indicadas
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Browser, type Page } from "@playwright/test";

type Width = 1440 | 390;

type Screen = {
  route: string;
  /** Archivo del mockup para cada ancho; `null` si no hay mockup para ese ancho. */
  mockups: Record<Width, string | null>;
};

const screens: Record<string, Screen> = {
  inicio: { route: "/", mockups: { 1440: "inicio-desktop.html", 390: "inicio-mobile.html" } },
  tienda: { route: "/tienda", mockups: { 1440: "tienda.html", 390: null } },
};

const viewportHeight: Record<Width, number> = { 1440: 900, 390: 844 };

const root = path.resolve(import.meta.dirname, "..");
const mockupDir = path.join(root, "docs/mockup");
const outDir = path.join(mockupDir, "comparaciones");
const logoPath = path.join(root, "public/brand/homebakery_logo_white.png");
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

/**
 * El mockup trae sintaxis de la herramienta de diseño (<sc-if>, <sc-for>,
 * {{…}}) que resolvía un support.js que no está en el repo. Esta función
 * corre dentro del navegador y la resuelve con los valores del
 * <script type="text/x-dc"> de cada archivo, o con sus hint-placeholder-*.
 */
function renderMockup() {
  type Scope = Record<string, unknown>;

  const source = document.querySelector('script[type="text/x-dc"]')?.textContent ?? "";
  let values: Scope = {};
  if (source.includes("class Component")) {
    class DCLogic {
      props: Scope;
      state: Scope = {};
      constructor(props: Scope) {
        this.props = props;
      }
      setState() {}
    }
    const Component = new Function("DCLogic", `${source}; return Component;`)(DCLogic);
    values = new Component({}).renderVals();
  }

  const unwrap = (raw: string | null) => (raw ?? "").replace(/^\s*\{\{([\s\S]*)\}\}\s*$/, "$1");
  const evaluate = (expression: string, scope: Scope): unknown => {
    try {
      return new Function(...Object.keys(scope), `return (${expression});`)(...Object.values(scope));
    } catch {
      return undefined;
    }
  };
  const interpolate = (text: string, scope: Scope) =>
    text.replace(/\{\{([\s\S]+?)\}\}/g, (_, expression) => {
      const value = evaluate(expression, scope);
      return value == null ? "" : String(value);
    });

  function process(parent: ParentNode, scope: Scope) {
    for (const node of [...parent.childNodes]) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent?.includes("{{")) node.textContent = interpolate(node.textContent, scope);
        continue;
      }
      if (!(node instanceof Element)) continue;
      const tag = node.tagName.toLowerCase();
      if (tag === "script" || tag === "style") continue;

      if (tag === "sc-if") {
        let visible = evaluate(unwrap(node.getAttribute("value")), scope);
        if (visible === undefined) visible = evaluate(unwrap(node.getAttribute("hint-placeholder-val")), scope);
        if (visible) {
          process(node, scope);
          node.replaceWith(...node.childNodes);
        } else {
          node.remove();
        }
        continue;
      }

      if (tag === "sc-for") {
        const name = node.getAttribute("as") ?? "item";
        let list = evaluate(unwrap(node.getAttribute("list")), scope);
        if (!Array.isArray(list)) {
          list = Array.from({ length: Number(node.getAttribute("hint-placeholder-count") ?? 1) }, () => ({}));
        }
        const fragment = document.createDocumentFragment();
        for (const item of list as unknown[]) {
          const clone = node.cloneNode(true) as Element;
          process(clone, { ...scope, [name]: item });
          fragment.append(...clone.childNodes);
        }
        node.replaceWith(fragment);
        continue;
      }

      for (const attribute of [...node.attributes]) {
        if (!attribute.value.includes("{{")) continue;
        if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name);
        else attribute.value = interpolate(attribute.value, scope);
      }
      process(node, scope);
    }
  }

  process(document.body, values);

  // El lienzo tiene un alto fijo: se libera para comparar el alto real.
  const canvas = document.querySelector<HTMLElement>("x-dc > div");
  if (canvas) canvas.style.height = "auto";
}

async function capture(page: Page, url: string, isMockup: boolean) {
  await page.goto(url, { waitUntil: "load" });
  if (isMockup) {
    await page.evaluate(renderMockup);
  } else {
    // Oculta el indicador de Next en desarrollo.
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  return page.screenshot({ fullPage: true, animations: "disabled" });
}

async function newPage(browser: Browser, width: Width) {
  const context = await browser.newContext({ viewport: { width, height: viewportHeight[width] } });
  const page = await context.newPage();
  const logo = await readFile(logoPath);
  await page.route("**/logo-blanco.png", (route) => route.fulfill({ body: logo, contentType: "image/png" }));
  await page.route("**/support.js", (route) => route.fulfill({ body: "", contentType: "text/javascript" }));
  return page;
}

/** Arma la imagen mockup · sitio · diferencia en una página y la captura. */
async function compose(browser: Browser, width: Width, mockup: Buffer | null, site: Buffer) {
  const src = (png: Buffer) => `data:image/png;base64,${png.toString("base64")}`;
  const column = (title: string, body: string) =>
    `<figure><figcaption>${title}</figcaption><div class="frame">${body}</div></figure>`;

  const columns = mockup
    ? [
        column("Mockup", `<img src="${src(mockup)}">`),
        column("Sitio", `<img src="${src(site)}">`),
        column(
          "Diferencia",
          `<img src="${src(mockup)}"><img class="over" src="${src(site)}">`,
        ),
      ]
    : [column("Sitio (sin mockup para este ancho)", `<img src="${src(site)}">`)];

  const html = `<!doctype html><html><head><style>
    body { margin: 0; display: flex; gap: 24px; padding: 24px; background: #888; font: 600 20px system-ui; align-items: flex-start; }
    figure { margin: 0; }
    figcaption { color: #fff; margin-bottom: 12px; }
    .frame { position: relative; width: ${width}px; background: #000; }
    .frame img { display: block; width: ${width}px; }
    .frame img.over { position: absolute; inset: 0 auto auto 0; mix-blend-mode: difference; }
  </style></head><body>${columns.join("")}</body></html>`;

  const columnsCount = mockup ? 3 : 1;
  const context = await browser.newContext({
    viewport: { width: columnsCount * width + (columnsCount + 1) * 24, height: 800 },
  });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: "load" });
  const png = await page.screenshot({ fullPage: true });
  await context.close();
  return png;
}

async function main() {
  const requested = process.argv.slice(2);
  const unknown = requested.filter((name) => !(name in screens));
  if (unknown.length > 0) {
    console.error(`Pantallas desconocidas: ${unknown.join(", ")}. Disponibles: ${Object.keys(screens).join(", ")}`);
    process.exit(1);
  }
  const names = requested.length > 0 ? requested : Object.keys(screens);

  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();

  try {
    for (const name of names) {
      const screen = screens[name];
      for (const width of [1440, 390] as const) {
        const page = await newPage(browser, width);
        const mockupFile = screen.mockups[width];
        const mockup = mockupFile
          ? await capture(page, pathToFileURL(path.join(mockupDir, mockupFile)).href, true)
          : null;
        const site = await capture(page, new URL(screen.route, baseUrl).href, false);
        await page.context().close();

        const prefix = path.join(outDir, `${name}-${width}`);
        if (mockup) await writeFile(`${prefix}-mockup.png`, mockup);
        await writeFile(`${prefix}-sitio.png`, site);
        await writeFile(`${prefix}.png`, await compose(browser, width, mockup, site));
        console.log(`✓ ${path.relative(root, prefix)}.png`);
      }
    }
  } finally {
    await browser.close();
  }
}

await main();
