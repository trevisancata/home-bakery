# Entregables y evidencia

Una sección por cada ítem de la rúbrica: los seis entregables (E1 a E6) y los cinco criterios transversales. Cada una dice qué pide el nivel Excelente, qué hace el proyecto y dónde verlo.

> **TODO(rúbrica):** el texto de la rúbrica no está en el repo. Falta copiar, en cada sección, el nombre oficial del ítem y lo que pide el nivel Excelente. El tema de E1, E2 y E3 y los nombres de los cinco transversales que figuran acá se armaron a partir de los PRs y del README anterior: **hay que confirmarlos con la rúbrica** y mover la evidencia si algún ítem no coincide.

**Links rápidos**

- Sitio: [home-bakery-brown.vercel.app](https://home-bakery-brown.vercel.app) · [sitemap.xml](https://home-bakery-brown.vercel.app/sitemap.xml) · [robots.txt](https://home-bakery-brown.vercel.app/robots.txt)
- API: [`/api/v1/health`](https://home-bakery-brown.vercel.app/api/v1/health) · [`/api/v1/categorias`](https://home-bakery-brown.vercel.app/api/v1/categorias) · [`/api/v1/productos`](https://home-bakery-brown.vercel.app/api/v1/productos) · [`/api/v1/workshops`](https://home-bakery-brown.vercel.app/api/v1/workshops)
- Repositorio: [github.com/trevisancata/home-bakery](https://github.com/trevisancata/home-bakery) · [PRs mergeados](https://github.com/trevisancata/home-bakery/pulls?q=is%3Apr+is%3Amerged)
- Docs: [README](../README.md) · [bitácora de IA](bitacora-ia.md) · [errores](errores.md) · [testing](testing.md) · [Lighthouse](lighthouse.md) · [deploy](deploy.md) · [seguridad](seguridad.md) · [modelo de datos](modelo-de-datos.md) · [pagos](pagos.md) · [guía del panel](guia-panel.md)

**Tests** (corrida del 09/11/2026): 253 con Playwright en 24 archivos, entre e2e, de la API y unitarios. Los 72 unitarios corren en el CI de cada PR (`npm run test:unit`); el resto, en local antes de mergear (ver [Decisiones](#decisiones)). Detalle por archivo: [testing.md](testing.md#qué-cubre-cada-archivo).

## Índice

- [E1](#e1) · [E2](#e2) · [E3](#e3) · [E4: base de datos con Supabase](#e4-base-de-datos-con-supabase) · [E5: auth, roles y panel de administración](#e5-auth-roles-y-panel-de-administración) · [E6: pagos con Mercado Pago](#e6-pagos-con-mercado-pago)
- Transversales: [T1](#t1-html-semántico) · [T2](#t2-diseño-responsive-mobile-first) · [T3](#t3-accesibilidad-wcag-aa) · [T4](#t4-consistencia-visual) · [T5](#t5-proceso-git-prs-ci-y-documentación)
- [Decisiones](#decisiones)

---

## E1

**Nivel Excelente:** TODO(rúbrica).

**Qué hace el proyecto.** Repositorio con CI y plantilla de PR desde el primer día, README en español y la primera versión del sitio con las vistas principales (inicio, tienda, workshops, Maggie).

**Evidencia**

- PRs: [#1](https://github.com/trevisancata/home-bakery/pull/1) (workflow de CI y [plantilla de PR](../.github/pull_request_template.md)), [#2](https://github.com/trevisancata/home-bakery/pull/2) (README en español), [#3](https://github.com/trevisancata/home-bakery/pull/3) (landing y vistas principales).
- Archivos: [`app/(sitio)/`](../app/%28sitio%29), [`app/layout.tsx`](../app/layout.tsx), [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
- Sitio: [inicio](https://home-bakery-brown.vercel.app/), [tienda](https://home-bakery-brown.vercel.app/tienda), [workshops](https://home-bakery-brown.vercel.app/workshops), [Maggie](https://home-bakery-brown.vercel.app/maggie).

## E2

**Nivel Excelente:** TODO(rúbrica).

**Qué hace el proyecto.** Sistema de diseño propio (tokens de color y tipografías de la marca en `@theme` de Tailwind v4, componentes base) y las páginas fieles al mockup en mobile y desktop, con 404 propio y medición de Lighthouse.

**Evidencia**

- PRs: [#4](https://github.com/trevisancata/home-bakery/pull/4) (diseño de marca), [#5](https://github.com/trevisancata/home-bakery/pull/5) (fidelidad al mockup en inicio, tienda, header, footer y WhatsApp), [#6](https://github.com/trevisancata/home-bakery/pull/6) (workshops, Maggie, 404 y Lighthouse), [#9](https://github.com/trevisancata/home-bakery/pull/9) (menú mobile), [#19](https://github.com/trevisancata/home-bakery/pull/19) (tipografía manuscrita).
- Archivos: [`app/globals.css`](../app/globals.css) (tokens), [`components/`](../components) (`Button`, `Eyebrow`, `SectionTitle`, `ImageFrame`), [`app/not-found.tsx`](../app/not-found.tsx), [`docs/mockup/`](mockup), [`scripts/compare-mockup.ts`](../scripts/compare-mockup.ts) (`npm run compare`).
- Capturas: [`tipografia-final-home-mobile.png`](capturas/tipografia-final-home-mobile.png), [`tipografia-final-home-desktop.png`](capturas/tipografia-final-home-desktop.png).

## E3

**Nivel Excelente:** TODO(rúbrica).

**Qué hace el proyecto.** Formulario de inscripción a workshops con validación por campo (zod), foco en el primer error, estados de envío, error con reintento y éxito; contenido real del negocio cargado desde `data/site.ts`, sin textos escritos en los componentes ni datos inventados.

**Evidencia**

- PRs: [#7](https://github.com/trevisancata/home-bakery/pull/7) (inscripción a workshops), [#8](https://github.com/trevisancata/home-bakery/pull/8) (bitácora y errores), [#10](https://github.com/trevisancata/home-bakery/pull/10) (contenido de Maggie v6), [#17](https://github.com/trevisancata/home-bakery/pull/17) (contenido de Maggie 2).
- Archivos: [`components/inscripcion/InscripcionForm.tsx`](../components/inscripcion/InscripcionForm.tsx), [`lib/validation/inscripcion.ts`](../lib/validation/inscripcion.ts), [`data/site.ts`](../data/site.ts), [`docs/contenido-maggie.md`](contenido-maggie.md).
- Tests: `inscripcion.spec.ts` (errores por campo con foco, envío, workshops de ejemplo sin inscripción).
- Decisión documentada: [no publicar datos inventados](bitacora-ia.md#decisión-no-publicar-datos-inventados).

## E4: base de datos con Supabase

**Nivel Excelente:** TODO(rúbrica). Pide, entre otras cosas, el checklist de la plantilla en los PRs (ver [Checklist en los PRs](#checklist-en-los-prs)).

**Qué hace el proyecto.** El catálogo, los workshops, las inscripciones y los pedidos viven en Postgres (Supabase), con once migraciones versionadas, RLS en todas las tablas, lectura pública solo de lo activo y la inscripción por una función `security definer` con bloqueo de fila para que no haya sobreventa. Las páginas públicas son estáticas con ISR (5 minutos) y se regeneran al instante cuando Maggie cambia algo. API REST versionada en `/api/v1` con respuestas `{ data }` / `{ error }`.

**Evidencia**

- PRs: [#11](https://github.com/trevisancata/home-bakery/pull/11) (catálogo y workshops en Supabase), [#18](https://github.com/trevisancata/home-bakery/pull/18) (e2e independientes del catálogo real), [#26](https://github.com/trevisancata/home-bakery/pull/26) ("Así fueron los workshops" desde la base).
- Migraciones: [`supabase/migrations/`](../supabase/migrations) (0001 a 0011).
- Docs: [modelo-de-datos.md](modelo-de-datos.md) (diagrama, [RLS](modelo-de-datos.md#permisos-y-rls), [por qué la inscripción va por una función](modelo-de-datos.md#por-qué-la-inscripción-va-por-una-función), [caché](modelo-de-datos.md#caché)).
- Código: [`lib/data.ts`](../lib/data.ts), [`app/api/v1/`](../app/api/v1), [`scripts/seed.ts`](../scripts/seed.ts).
- Tests: `api.spec.ts` (25: categorías, productos, 400/404, workshops, inscripciones con 409 y sin sobreventa con pedidos simultáneos, redirecciones 308).
- API en producción: [`/api/v1/productos`](https://home-bakery-brown.vercel.app/api/v1/productos), [`/api/v1/workshops`](https://home-bakery-brown.vercel.app/api/v1/workshops).

## E5: auth, roles y panel de administración

**Nivel Excelente:** TODO(rúbrica).

**Qué hace el proyecto.** Login de la admin con Supabase Auth (sesión en cookies HttpOnly), roles en `perfiles`, defensa en profundidad (proxy, verificación en cada página, handler y Server Action, y RLS), 401 vs 403, CSRF por `Origin`, rate limiting del login y registro público cerrado. Panel para Maggie con productos (precio en línea, pausar con Deshacer, destacados, fotos en webp), workshops, inscripciones con devoluciones y pedidos de la tienda en pestañas. Guía de uso escrita para Maggie.

**Evidencia**

- PRs: [#12](https://github.com/trevisancata/home-bakery/pull/12) (auth, roles y API de admin), [#15](https://github.com/trevisancata/home-bakery/pull/15) (panel de Maggie), [#23](https://github.com/trevisancata/home-bakery/pull/23) (panel de pedidos), [#38](https://github.com/trevisancata/home-bakery/pull/38) (pedidos simples).
- Docs: [seguridad.md](seguridad.md), [guia-panel.md](guia-panel.md), [README: panel de administración](../README.md#panel-de-administración).
- Código: [`proxy.ts`](../proxy.ts), [`lib/auth.ts`](../lib/auth.ts), [`lib/admin/`](../lib/admin), [`app/admin/`](../app/admin), [`app/api/v1/admin/`](../app/api/v1/admin).
- Tests: `admin.spec.ts` (11), `panel.spec.ts` (7), `panel-pedidos.spec.ts` (10), `cerrar-sesion.spec.ts`, `rate-limit.spec.ts`, `panel-unit.spec.ts`.
- Capturas: [`panel-pedidos-lista-mobile.png`](capturas/panel-pedidos-lista-mobile.png), [`panel-pedidos-detalle-mobile.png`](capturas/panel-pedidos-detalle-mobile.png), [`pedidos-simples-pestanas-mobile.png`](capturas/pedidos-simples-pestanas-mobile.png), [`workshops-pasados-panel-subir.png`](capturas/workshops-pasados-panel-subir.png).
- Lighthouse del panel: Accessibility y Best Practices 100 / 100 en todas las pantallas medidas, mobile y desktop ([lighthouse.md](lighthouse.md#panel-de-pedidos)).
- En producción: [`/admin/ingresar`](https://home-bakery-brown.vercel.app/admin/ingresar) (sin sesión, `/admin` redirige ahí).

## E6: pagos con Mercado Pago

**Nivel Excelente:** TODO(rúbrica).

**Qué hace el proyecto.** Checkout Pro con el SDK oficial para los workshops (pago completo al inscribirse) y para los pedidos de la tienda, que además aceptan transferencia y efectivo. Los montos los calcula la base, nunca el cliente. Webhook con firma `x-signature`, idempotente y con conciliación en la página de resultado; pagar no confirma el pedido (lo confirma Maggie). Devoluciones marcadas desde el panel. Mock local de MP para los tests, sin credenciales reales.

**Evidencia**

- PRs: [#13](https://github.com/trevisancata/home-bakery/pull/13) (seña con Mercado Pago), [#14](https://github.com/trevisancata/home-bakery/pull/14) y [#16](https://github.com/trevisancata/home-bakery/pull/16) (webhook), [#21](https://github.com/trevisancata/home-bakery/pull/21) (carrito y pedidos), [#22](https://github.com/trevisancata/home-bakery/pull/22) (medios de pago), [#37](https://github.com/trevisancata/home-bakery/pull/37) (pruebas manuales MP-16 a MP-42).
- Docs: [pagos.md](pagos.md) (flujo, estados, [credenciales por etapa](pagos.md#qué-credenciales-se-usan-en-cada-etapa)), [pruebas-mercadopago.md](pruebas-mercadopago.md), [errores.md: 401 del webhook](errores.md#401-del-webhook-con-los-pagos-reales).
- Código: [`lib/mercadopago.ts`](../lib/mercadopago.ts), [`lib/pagos/`](../lib/pagos), [`app/api/v1/webhooks/mercadopago/route.ts`](../app/api/v1/webhooks/mercadopago/route.ts), [`app/api/v1/pedidos/route.ts`](../app/api/v1/pedidos/route.ts), [`e2e/support/mp-mock.ts`](../e2e/support/mp-mock.ts).
- Tests: `pagos.spec.ts` (21), `pedidos.spec.ts` (36), `carrito.spec.ts` (15), `pagos-unit.spec.ts` (21), `pedidos-unit.spec.ts` (35).
- Capturas: [`checkout-mobile.png`](capturas/checkout-mobile.png), [`medios-de-pago-checkout-mobile.png`](capturas/medios-de-pago-checkout-mobile.png), [`pedido-pagado-mobile.png`](capturas/pedido-pagado-mobile.png), [`pedido-transferencia-mobile.png`](capturas/pedido-transferencia-mobile.png), [`pedido-efectivo-mobile.png`](capturas/pedido-efectivo-mobile.png).
- Lighthouse: `/carrito` y `/carrito/checkout` con Accessibility y Best Practices 100 ([lighthouse.md](lighthouse.md#tienda-carrito-y-checkout-pedidos)).

---

## T1: HTML semántico

**Nivel Excelente:** TODO(rúbrica).

**Qué hace el proyecto.** Landmarks (`header`, `nav`, `main`, `footer`), un `h1` por página y jerarquía de títulos, listas y `dl` para los datos de producto, formularios con `label` asociado, `fieldset` y mensajes de error ligados con `aria-describedby`. Metadata por página, Open Graph del producto, y desde este PR sitemap y robots.txt.

**Evidencia**

- Código: [`app/(sitio)/layout.tsx`](../app/%28sitio%29/layout.tsx), [`app/(sitio)/tienda/[slug]/page.tsx`](../app/%28sitio%29/tienda/[slug]/page.tsx) (`dl` de detalles y `generateMetadata`), [`components/carrito/CheckoutForm.tsx`](../components/carrito/CheckoutForm.tsx), [`app/sitemap.ts`](../app/sitemap.ts), [`app/robots.ts`](../app/robots.ts), [`lib/seo.ts`](../lib/seo.ts).
- Tests: `seo-unit.spec.ts` y `seo.spec.ts` (sitemap y robots), `menu-mobile.spec.ts`.
- Lighthouse SEO 100 en `/`, `/tienda`, `/tienda/[slug]`, `/workshops` y `/maggie` ([lighthouse.md](lighthouse.md#sitio-público-última-medición)). Las pantallas con `noindex` (panel, carrito, resultado de pago) dan 63 a propósito.

## T2: Diseño responsive (mobile-first)

**Nivel Excelente:** TODO(rúbrica).

**Qué hace el proyecto.** Estilos mobile-first con Tailwind, revisados a 390 px y 1440 px; menú mobile accesible, carrusel con swipe, scroll horizontal enfocable en `/maggie`, panel usable desde el celular (botones de al menos 44 px, sin scroll horizontal).

**Evidencia**

- PRs: [#25](https://github.com/trevisancata/home-bakery/pull/25), [#27](https://github.com/trevisancata/home-bakery/pull/27) y [#28](https://github.com/trevisancata/home-bakery/pull/28) (ajustes visuales, con capturas antes y después en mobile y desktop).
- Capturas: [`docs/capturas/`](capturas) (por ejemplo [`ajustes3-inicio-como-pedir-mobile-despues.png`](capturas/ajustes3-inicio-como-pedir-mobile-despues.png) y [`ajustes3-inicio-como-pedir-desktop-despues.png`](capturas/ajustes3-inicio-como-pedir-desktop-despues.png)).
- Tests: `menu-mobile.spec.ts`, `carrusel.spec.ts` (swipe con toques reales), `ajustes-visuales-3.spec.ts` (390 y 1440 px), `panel-pedidos.spec.ts` (390 px).
- Pruebas manuales en un celular real: MP-18, MP-21, MP-25, MP-30, MP-36, MP-38, MP-40 y MP-41 ([testing.md](testing.md#plan-de-pruebas-manuales)).

## T3: Accesibilidad (WCAG AA)

**Nivel Excelente:** TODO(rúbrica).

**Qué hace el proyecto.** Contraste AA medido (los tokens que no llegan a AA como texto se usan solo para fondos y bordes), foco visible, navegación con teclado, salto al contenido, `aria-live` en el carrusel y en el contador del carrito, diálogos que enfocan la opción segura, alt en todas las fotos (obligatorio al subirlas desde el panel) y respeto de `prefers-reduced-motion`.

**Evidencia**

- Lighthouse Accessibility 100 en todas las páginas públicas y del panel medidas ([lighthouse.md](lighthouse.md)); contraste del texto sobre las portadas medido en 390 y 1440 px ([lighthouse.md](lighthouse.md#contraste-del-texto-sobre-las-portadas)).
- Tests: `header.spec.ts` (contraste ≥ 4,5:1 y foco ≥ 3:1), `carrusel.spec.ts` (teclado y `aria-live`), `menu-mobile.spec.ts` (Escape devuelve el foco), `inscripcion.spec.ts` y `panel.spec.ts` (foco en el primer error).
- Errores corregidos: [los diálogos enfocaban "Borrar definitivamente"](errores.md#los-diálogos-enfocaban-borrar-definitivamente).
- Pruebas manuales de teclado, lector de pantalla y zoom en el [plan de pruebas manuales](testing.md#plan-de-pruebas-manuales).

## T4: Consistencia visual

**Nivel Excelente:** TODO(rúbrica).

**Qué hace el proyecto.** Un solo sistema de diseño (tokens, cuatro tipografías con roles fijos y componentes base) para el sitio y el panel; todos los textos en [`data/site.ts`](../data/site.ts) y [`data/admin.ts`](../data/admin.ts), con el mismo tono; comparación automática con el mockup.

**Evidencia**

- [README: sistema de diseño](../README.md#sistema-de-diseño), [`app/globals.css`](../app/globals.css), [`components/`](../components), [`components/admin/ui/`](../components/admin/ui).
- PRs: [#4](https://github.com/trevisancata/home-bakery/pull/4), [#5](https://github.com/trevisancata/home-bakery/pull/5), [#19](https://github.com/trevisancata/home-bakery/pull/19), [#25](https://github.com/trevisancata/home-bakery/pull/25), [#27](https://github.com/trevisancata/home-bakery/pull/27), [#28](https://github.com/trevisancata/home-bakery/pull/28).
- Capturas antes y después: [`docs/capturas/`](capturas).

## T5: Proceso: Git, PRs, CI y documentación

**Nivel Excelente:** TODO(rúbrica).

**Qué hace el proyecto.** Todo entra por PR desde una rama, con `main` protegida por el check `build` del CI (lint, `tsc`, build y unitarios), preview de Vercel por PR, deploy automático a producción, Dependabot, `/api/v1/health` para el monitoreo y rollback documentado. Bitácora del trabajo con IA y registro de errores por PR.

**Evidencia**

- PRs: [#1](https://github.com/trevisancata/home-bakery/pull/1) (CI y plantilla), [#20](https://github.com/trevisancata/home-bakery/pull/20) (testing, depuración y calidad), [#29](https://github.com/trevisancata/home-bakery/pull/29) (DevOps).
- Docs: [deploy.md](deploy.md), [testing.md](testing.md) (estrategia, plan de pruebas manuales, [reporte de bugs](testing.md#reporte-de-bugs), [depuración](testing.md#depuración)), [bitacora-ia.md](bitacora-ia.md), [errores.md](errores.md).
- Captura del check del CI: [`devops-ci-check.png`](capturas/devops-ci-check.png).
- Health en producción: [`/api/v1/health`](https://home-bakery-brown.vercel.app/api/v1/health) (`{ status, version, commit }`).

### Checklist en los PRs

La [plantilla de PR](../.github/pull_request_template.md) tiene un checklist de cinco puntos. Revisión de los PRs mergeados desde el #11 (09/11/2026). Los PRs viejos no se editaron.

| Con el checklist de la plantilla | Sin el checklist |
|---|---|
| [#11](https://github.com/trevisancata/home-bakery/pull/11), [#12](https://github.com/trevisancata/home-bakery/pull/12), [#13](https://github.com/trevisancata/home-bakery/pull/13), [#14](https://github.com/trevisancata/home-bakery/pull/14), [#15](https://github.com/trevisancata/home-bakery/pull/15), [#25](https://github.com/trevisancata/home-bakery/pull/25), [#29](https://github.com/trevisancata/home-bakery/pull/29), [#37](https://github.com/trevisancata/home-bakery/pull/37) | [#16](https://github.com/trevisancata/home-bakery/pull/16), [#17](https://github.com/trevisancata/home-bakery/pull/17), [#18](https://github.com/trevisancata/home-bakery/pull/18), [#19](https://github.com/trevisancata/home-bakery/pull/19), [#20](https://github.com/trevisancata/home-bakery/pull/20), [#21](https://github.com/trevisancata/home-bakery/pull/21), [#22](https://github.com/trevisancata/home-bakery/pull/22), [#23](https://github.com/trevisancata/home-bakery/pull/23), [#24](https://github.com/trevisancata/home-bakery/pull/24), [#26](https://github.com/trevisancata/home-bakery/pull/26), [#27](https://github.com/trevisancata/home-bakery/pull/27), [#28](https://github.com/trevisancata/home-bakery/pull/28), [#38](https://github.com/trevisancata/home-bakery/pull/38) |

En los que lo tienen, los puntos sin marcar dicen por qué no aplican (por ejemplo, "Revisado en mobile (no aplica: sin cambios de interfaz)"). Este PR usa la plantilla con el checklist completo.

---

## Decisiones

- **Categorías fijas, no editables desde el panel.** Las siete categorías salen del seed y Maggie no las crea ni las edita: son la estructura de la tienda y del filtro, y cambian muy poco. Agregar una se hace con el seed o con SQL. Además, los tests comparan esa lista y no crean categorías de prueba, para no cambiar los filtros mientras corren otros tests en paralelo ([`e2e/api.spec.ts`](../e2e/api.spec.ts)). La base ya permite que la admin las escriba (RLS en [modelo-de-datos.md](modelo-de-datos.md#permisos-y-rls)), así que sumarlas al panel no pide migración.
- **Los e2e no corren en el CI.** Comparten la base de producción, el test del rate limit bloquea los logins 15 minutos y necesitan la secret key, que se saltea RLS. En el CI corren lint, `tsc`, build y los unitarios; los e2e, en local antes de mergear. Para correrlos en CI haría falta un proyecto de Supabase solo para tests ([deploy.md](deploy.md#por-qué-los-e2e-no-corren-en-ci)).
- **Credenciales de prueba de Mercado Pago hasta pasar a producción.** Hoy el sitio usa las credenciales de producción de una aplicación creada dentro de la cuenta vendedora de prueba: no cobran plata real. Al publicar se cambian, a la vez, el token y la clave del webhook por los de la cuenta de Maggie ([pagos.md](pagos.md#qué-credenciales-se-usan-en-cada-etapa), [checklist para pasar a producción](deploy.md#checklist-para-pasar-a-producción-real)).
- **Sin mails por falta de SMTP.** El SMTP por defecto de Supabase solo manda a los miembros del equipo y unos pocos mails por hora. Por eso el sitio no promete mails: los pedidos y las inscripciones se avisan por WhatsApp desde el panel, y el único mail es el de recuperar la contraseña del panel. Qué falta para tener mails: [README: TODO(SMTP)](../README.md#todosmtp-mails-de-producción), [errores.md](errores.md#las-plantillas-de-mail-no-se-pueden-editar-sin-smtp-propio).
