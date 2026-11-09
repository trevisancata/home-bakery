# Entregables y evidencia

Una sección por cada ítem de la rúbrica: los seis entregables (E1 a E6) y los cinco criterios transversales, con su ponderación, lo que pide el nivel Excelente, qué hace el proyecto y dónde verlo.

**Condiciones de la cátedra:** hay que obtener Excelente en los cinco transversales; si no, el trabajo queda desaprobado. La demo es pública, en vivo y con preguntas técnicas.

**Links rápidos**

- Sitio: [home-bakery-brown.vercel.app](https://home-bakery-brown.vercel.app) · [sitemap.xml](https://home-bakery-brown.vercel.app/sitemap.xml) · [robots.txt](https://home-bakery-brown.vercel.app/robots.txt)
- API: [`/api/v1/health`](https://home-bakery-brown.vercel.app/api/v1/health) · [`/api/v1/categorias`](https://home-bakery-brown.vercel.app/api/v1/categorias) · [`/api/v1/productos`](https://home-bakery-brown.vercel.app/api/v1/productos) · [`/api/v1/workshops`](https://home-bakery-brown.vercel.app/api/v1/workshops)
- Repositorio: [github.com/trevisancata/home-bakery](https://github.com/trevisancata/home-bakery) · [PRs mergeados](https://github.com/trevisancata/home-bakery/pulls?q=is%3Apr+is%3Amerged)
- Docs: [README](../README.md) · [bitácora de IA](bitacora-ia.md) · [errores](errores.md) · [testing](testing.md) · [Lighthouse](lighthouse.md) · [deploy](deploy.md) · [seguridad](seguridad.md) · [modelo de datos](modelo-de-datos.md) · [pagos](pagos.md) · [guía del panel](guia-panel.md)

**Tests** (corrida del 09/11/2026): 253 con Playwright en 24 archivos, entre e2e, de la API y unitarios. Los 72 unitarios corren en el CI de cada PR (`npm run test:unit`); el resto, en local antes de mergear (ver [Decisiones](#decisiones)). Detalle por archivo: [testing.md](testing.md#qué-cubre-cada-archivo).

## Índice

| Ítem | Peso | |
|---|---|---|
| [E1 Repo + pipeline + preview](#e1-repo--pipeline--preview-10) | 10% | Entregable |
| [E2 Landing + vistas clave responsivas](#e2-landing--vistas-clave-responsivas-15) | 15% | Entregable |
| [E3 Formularios dinámicos con fetch + validación](#e3-formularios-dinámicos-con-fetch--validación-15) | 15% | Entregable |
| [E4 Catálogo navegable + API básica](#e4-catálogo-navegable--api-básica-20) | 20% | Entregable |
| [E5 CRUD funcional en Supabase + admin](#e5-crud-funcional-en-supabase--admin-20) | 20% | Entregable |
| [E6 Checkout + webhook funcionales](#e6-checkout--webhook-funcionales-20) | 20% | Entregable |
| [Funcionalidad](#funcionalidad-40) | 40% | Transversal |
| [Código / Estructura](#código--estructura-20) | 20% | Transversal |
| [Interfaz / Accesibilidad](#interfaz--accesibilidad-15) | 15% | Transversal |
| [Despliegue](#despliegue-15) | 15% | Transversal |
| [Documentación](#documentación-10) | 10% | Transversal |

Al final: [Decisiones](#decisiones).

---

## E1 Repo + pipeline + preview (10%)

**Nivel Excelente:** repo operativo, pipeline CI/CD y preview por PR funcionando correctamente.

**Qué hace el proyecto.** Todo entra por PR desde una rama; `main` está protegida y pide el check `build` del CI. El CI corre lint, `tsc`, build y los tests unitarios en cada PR y cada push a `main`, con caché del build y el reporte de Playwright como artifact si algo falla. Vercel arma un preview por PR y deploya solo a producción cada merge a `main`. Dependabot propone las actualizaciones de dependencias y de acciones.

**Evidencia**

- PRs: [#1](https://github.com/trevisancata/home-bakery/pull/1) (workflow de CI y plantilla de PR), [#29](https://github.com/trevisancata/home-bakery/pull/29) (CI con `tsc` y unitarios, Dependabot, Analytics, health y `docs/deploy.md`).
- Archivos: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), [`.github/dependabot.yml`](../.github/dependabot.yml), [`.github/pull_request_template.md`](../.github/pull_request_template.md).
- Cada PR mergeado desde el #16 tiene en verde los checks `build` (CI), `Vercel` (deploy del preview) y `Vercel Preview Comments`. Captura del check: [`devops-ci-check.png`](capturas/devops-ci-check.png).
- Docs: [deploy.md](deploy.md) ([entornos](deploy.md#entornos), [flujo de trabajo](deploy.md#flujo-de-trabajo), [CI](deploy.md#ci), [Dependabot](deploy.md#dependabot)).
- Un CI que falló sin jobs y cómo se diagnosticó: [errores.md](errores.md#el-ci-del-pr-falló-sin-correr-ningún-job).

## E2 Landing + vistas clave responsivas (15%)

**Nivel Excelente:** maquetado semántico, responsive, accesible y visualmente consistente.

**Qué hace el proyecto.**

- **Semántico:** landmarks (`header`, `nav`, `main`, `footer`), salto al contenido, un `h1` por página, `dl` para los datos del producto, formularios con `label`, `fieldset` y errores ligados con `aria-describedby`. Metadata por página, Open Graph del producto, sitemap y robots.txt.
- **Responsive:** mobile-first con Tailwind, revisado a 390 y 1440 px; menú mobile, carrusel con swipe, scroll horizontal enfocable en `/maggie`.
- **Accesible:** ver [Interfaz / Accesibilidad](#interfaz--accesibilidad-15).
- **Consistente:** un sistema de diseño (tokens de color y cuatro tipografías con roles fijos en `@theme`, componentes base) y todos los textos en `data/site.ts`, comparados contra el mockup.

**Evidencia**

- PRs: [#3](https://github.com/trevisancata/home-bakery/pull/3) (landing y vistas principales), [#4](https://github.com/trevisancata/home-bakery/pull/4) (diseño de marca), [#5](https://github.com/trevisancata/home-bakery/pull/5) (fidelidad al mockup), [#6](https://github.com/trevisancata/home-bakery/pull/6) (workshops, Maggie, 404 y Lighthouse), [#9](https://github.com/trevisancata/home-bakery/pull/9) (menú mobile), [#19](https://github.com/trevisancata/home-bakery/pull/19) (tipografía), [#25](https://github.com/trevisancata/home-bakery/pull/25), [#27](https://github.com/trevisancata/home-bakery/pull/27) y [#28](https://github.com/trevisancata/home-bakery/pull/28) (ajustes visuales con capturas antes y después).
- Código: [`app/(sitio)/`](../app/%28sitio%29), [`app/globals.css`](../app/globals.css) (tokens), [`components/`](../components) (`Button`, `Eyebrow`, `SectionTitle`, `ImageFrame`, `SkipLink`), [`app/sitemap.ts`](../app/sitemap.ts), [`app/robots.ts`](../app/robots.ts), [`data/site.ts`](../data/site.ts).
- Mockup y comparación: [`docs/mockup/`](mockup), [`scripts/compare-mockup.ts`](../scripts/compare-mockup.ts) (`npm run compare`); [README: sistema de diseño](../README.md#sistema-de-diseño).
- Tests: `menu-mobile.spec.ts`, `header.spec.ts`, `carrusel.spec.ts`, `ajustes-visuales-3.spec.ts` (390 y 1440 px), `workshops-portada.spec.ts`, `seo-unit.spec.ts` y `seo.spec.ts`.
- Capturas: [`docs/capturas/`](capturas), por ejemplo [`ajustes3-inicio-como-pedir-mobile-despues.png`](capturas/ajustes3-inicio-como-pedir-mobile-despues.png) y [`ajustes3-inicio-como-pedir-desktop-despues.png`](capturas/ajustes3-inicio-como-pedir-desktop-despues.png).
- Lighthouse: Accessibility, Best Practices y SEO en 100 en `/`, `/tienda`, `/tienda/[slug]`, `/workshops` y `/maggie` ([lighthouse.md](lighthouse.md#sitio-público-última-medición)).

## E3 Formularios dinámicos con fetch + validación (15%)

**Nivel Excelente:** DOM dinámico, validación robusta y fetch integrado correctamente.

**Qué hace el proyecto.**

- **Formularios:** inscripción a un workshop y checkout del pedido. Los dos validan en el navegador con el **mismo esquema zod que usa la API**, marcan el error en cada campo, llevan el foco al primero y mandan con `fetch` a `POST /api/v1/inscripciones` y `POST /api/v1/pedidos`. Muestran estados de envío, error con reintento, 409 sin lugares (con los que quedan), 429 y éxito, y redirigen a Mercado Pago o al resultado.
- **DOM dinámico:** el carrito vive en el navegador (contador del header con `aria-live`, cantidades editables y quitar); al abrirlo, revisa con `fetch` a `/api/v1/productos` si cambió algún precio o si un producto ya no está, y avisa. En el checkout, los días y horarios, el envío y los medios de pago cambian según lo que se elige (por ejemplo, sin efectivo con envío).
- **Validación robusta:** el servidor vuelve a validar todo y la base calcula los precios: un cliente que mande otros precios no cambia el total. Los datos se sanean (`trim`, largos máximos) y la API responde 400 con el error de cada campo.

**Evidencia**

- PRs: [#7](https://github.com/trevisancata/home-bakery/pull/7) (inscripción a workshops), [#21](https://github.com/trevisancata/home-bakery/pull/21) (carrito y checkout), [#22](https://github.com/trevisancata/home-bakery/pull/22) (medios de pago), [#24](https://github.com/trevisancata/home-bakery/pull/24) (tamaño único).
- Código: [`components/inscripcion/InscripcionForm.tsx`](../components/inscripcion/InscripcionForm.tsx), [`components/carrito/CheckoutForm.tsx`](../components/carrito/CheckoutForm.tsx), [`components/carrito/CarritoProvider.tsx`](../components/carrito/CarritoProvider.tsx), [`components/carrito/useRevision.ts`](../components/carrito/useRevision.ts), [`lib/validation/`](../lib/validation).
- Tests: `inscripcion.spec.ts` (errores por campo con foco, envío, workshops de ejemplo), `carrito.spec.ts` (15: agregar, editar, recargar, precio cambiado, producto desactivado, checkout con retiro, envío, transferencia y efectivo), `pedidos.spec.ts` (36: precios de la base aunque el cliente mande otros, fechas y horarios inválidos, `Origin` ajeno), `pedidos-unit.spec.ts` (esquema del pedido).
- Capturas: [`checkout-mobile.png`](capturas/checkout-mobile.png), [`carrito-mobile.png`](capturas/carrito-mobile.png), [`medios-de-pago-checkout-mobile.png`](capturas/medios-de-pago-checkout-mobile.png).
- Errores resueltos: [el carrito recuperaba una línea recién quitada](errores.md#el-carrito-recuperaba-una-línea-recién-quitada), [zod entró al JS de todas las páginas](errores.md#zod-entró-al-js-de-todas-las-páginas).

## E4 Catálogo navegable + API básica (20%)

**Nivel Excelente:** catálogo + API interna, lógica funcional y checklist en PRs.

**Qué hace el proyecto.** La tienda lista los productos activos por categoría con el filtro en la URL (`?categoria=`, funciona con recarga y con el botón atrás), con detalle por producto: tamaños y precios, sabores, temporada (fuera de temporada no se puede pedir), productos a medida que se consultan por WhatsApp y "Precio a confirmar". Las páginas son estáticas con ISR y se regeneran al instante cuando Maggie cambia algo. La API REST interna, versionada en `/api/v1`, responde `{ data }` o `{ error }` con los códigos correctos y caché en la CDN para las lecturas públicas.

**Evidencia**

- PRs: [#11](https://github.com/trevisancata/home-bakery/pull/11) (catálogo y workshops en Supabase, API `/api/v1`), [#18](https://github.com/trevisancata/home-bakery/pull/18) (e2e independientes del catálogo real), [#27](https://github.com/trevisancata/home-bakery/pull/27) (filtro desplegable).
- Código: [`app/(sitio)/tienda/`](../app/%28sitio%29/tienda), [`lib/data.ts`](../lib/data.ts), [`lib/api.ts`](../lib/api.ts), [`app/api/v1/`](../app/api/v1), [`lib/temporada.ts`](../lib/temporada.ts).
- API en producción: [`/api/v1/categorias`](https://home-bakery-brown.vercel.app/api/v1/categorias), [`/api/v1/productos`](https://home-bakery-brown.vercel.app/api/v1/productos), [`/api/v1/productos?categoria=budines`](https://home-bakery-brown.vercel.app/api/v1/productos?categoria=budines), [`/api/v1/workshops`](https://home-bakery-brown.vercel.app/api/v1/workshops). Tabla de rutas y códigos: [README: API interna](../README.md#api-interna).
- Tests: `tienda.spec.ts` (8: filtro en la URL, detalle, temporada, oculto → 404), `api.spec.ts` (25: categorías, productos con filtros y 400, detalle 404, workshops, inscripciones con 409 y sin sobreventa, redirecciones 308), `temporada.spec.ts`.
- Capturas: [`ajustes2-tienda-mobile-despues.png`](capturas/ajustes2-tienda-mobile-despues.png), [`ajustes3-tienda-mobile-despues.png`](capturas/ajustes3-tienda-mobile-despues.png).

### Checklist en los PRs

La [plantilla de PR](../.github/pull_request_template.md) tiene un checklist de cinco puntos. Estado de los PRs mergeados desde el #11:

| PRs | Checklist |
|---|---|
| [#11](https://github.com/trevisancata/home-bakery/pull/11), [#12](https://github.com/trevisancata/home-bakery/pull/12), [#13](https://github.com/trevisancata/home-bakery/pull/13), [#14](https://github.com/trevisancata/home-bakery/pull/14), [#15](https://github.com/trevisancata/home-bakery/pull/15), [#25](https://github.com/trevisancata/home-bakery/pull/25), [#29](https://github.com/trevisancata/home-bakery/pull/29), [#37](https://github.com/trevisancata/home-bakery/pull/37), [#39](https://github.com/trevisancata/home-bakery/pull/39) | Desde que se abrió el PR |
| [#16](https://github.com/trevisancata/home-bakery/pull/16), [#17](https://github.com/trevisancata/home-bakery/pull/17), [#18](https://github.com/trevisancata/home-bakery/pull/18), [#19](https://github.com/trevisancata/home-bakery/pull/19), [#20](https://github.com/trevisancata/home-bakery/pull/20), [#21](https://github.com/trevisancata/home-bakery/pull/21), [#22](https://github.com/trevisancata/home-bakery/pull/22), [#23](https://github.com/trevisancata/home-bakery/pull/23), [#24](https://github.com/trevisancata/home-bakery/pull/24), [#26](https://github.com/trevisancata/home-bakery/pull/26), [#27](https://github.com/trevisancata/home-bakery/pull/27), [#28](https://github.com/trevisancata/home-bakery/pull/28), [#38](https://github.com/trevisancata/home-bakery/pull/38) | Agregado el 09/11/2026 en la revisión final, al final de la descripción ("Checklist (agregado el 09/11/2026 en la revisión final)"), sin cambiar el resto |

En los agregados después, cada punto se marcó solo si el PR tenía evidencia, y la evidencia está al lado: el CI en verde para lint y build, capturas mobile para "Revisado en mobile", tests o Lighthouse de accesibilidad para "Accesibilidad básica", y el README tocado (o que no hacía falta) para "README actualizado". Lo que no tenía evidencia quedó sin marcar:

| PR | Sin marcar |
|---|---|
| #16 | Revisado en mobile y Accesibilidad básica (sin cambios de interfaz) |
| #18 | Revisado en mobile y Accesibilidad básica (solo tests) |
| #19 | Accesibilidad básica |
| #20 | Revisado en mobile (sin capturas) |
| #22, #24, #38 | Accesibilidad básica |

En los que lo tenían desde el principio, los puntos sin marcar dicen por qué no aplican (por ejemplo, "Revisado en mobile (no aplica: sin cambios de interfaz)").

## E5 CRUD funcional en Supabase + admin (20%)

**Nivel Excelente:** BD modelada, CRUD completo, persistencia y admin funcional.

**Qué hace el proyecto.**

- **Base modelada:** Postgres en Supabase con once migraciones versionadas: claves `uuid`, claves foráneas con `cascade` o `restrict`, `check`, `updated_at` con trigger, índices, RLS en todas las tablas y la lógica sensible (inscribir sin sobreventa, crear pedidos con los precios de la base, confirmar pagos, avanzar pedidos) en funciones `security definer` con permisos explícitos.
- **CRUD completo y persistencia:** productos (con tamaños, precios y fotos en Storage, convertidas a webp), workshops (con fotos y la foto de cómo fue), inscripciones (estado editable y devoluciones) y pedidos (aceptar, rechazar, marcar pagado, entregar, cancelar). Cada cambio regenera las páginas públicas.
- **Admin funcional:** login con Supabase Auth (cookies HttpOnly), rol admin en `perfiles`, verificación en el proxy, en cada página, handler y Server Action, y en RLS; 401 vs 403, CSRF por `Origin`, rate limiting del login y registro público cerrado. Panel pensado para Maggie, usable desde el celular, con una guía escrita para ella.

**Evidencia**

- PRs: [#11](https://github.com/trevisancata/home-bakery/pull/11) (modelo y migración inicial), [#12](https://github.com/trevisancata/home-bakery/pull/12) (auth, roles y API de admin), [#15](https://github.com/trevisancata/home-bakery/pull/15) (panel de Maggie), [#23](https://github.com/trevisancata/home-bakery/pull/23) (panel de pedidos), [#26](https://github.com/trevisancata/home-bakery/pull/26) (workshops pasados), [#38](https://github.com/trevisancata/home-bakery/pull/38) (pedidos simples).
- Migraciones: [`supabase/migrations/`](../supabase/migrations) (0001 a 0011). Docs: [modelo-de-datos.md](modelo-de-datos.md) ([diagrama](modelo-de-datos.md#diagrama), [RLS](modelo-de-datos.md#permisos-y-rls), [permisos por rol](modelo-de-datos.md#permisos-por-rol), [por qué la inscripción va por una función](modelo-de-datos.md#por-qué-la-inscripción-va-por-una-función)), [seguridad.md](seguridad.md), [guia-panel.md](guia-panel.md).
- Código: [`lib/admin/`](../lib/admin) (capa de servicio), [`app/admin/`](../app/admin), [`app/api/v1/admin/`](../app/api/v1/admin) (CRUD por API), [`proxy.ts`](../proxy.ts), [`lib/auth.ts`](../lib/auth.ts), [`lib/admin/revalidar.ts`](../lib/admin/revalidar.ts).
- Tests: `admin.spec.ts` (11: permisos, validación, `Origin`, productos, fotos, inscripciones y workshops), `panel.spec.ts` (7), `panel-pedidos.spec.ts` (10), `workshops-pasados.spec.ts` (5), `cerrar-sesion.spec.ts`, `rate-limit.spec.ts`, `panel-unit.spec.ts`; en `api.spec.ts`, sin sobreventa con pedidos simultáneos.
- Capturas: [`panel-pedidos-lista-mobile.png`](capturas/panel-pedidos-lista-mobile.png), [`panel-pedidos-detalle-mobile.png`](capturas/panel-pedidos-detalle-mobile.png), [`pedidos-simples-pestanas-mobile.png`](capturas/pedidos-simples-pestanas-mobile.png), [`workshops-pasados-panel-subir.png`](capturas/workshops-pasados-panel-subir.png).
- En producción: [`/admin/ingresar`](https://home-bakery-brown.vercel.app/admin/ingresar) (sin sesión, `/admin` redirige ahí).

## E6 Checkout + webhook funcionales (20%)

**Nivel Excelente:** pagos + webhooks, demo operativa y pruebas exhaustivas.

**Qué hace el proyecto.**

- **Pagos:** Checkout Pro con el SDK oficial para los workshops (pago completo al inscribirse) y para los pedidos de la tienda, que también aceptan transferencia y efectivo. Los montos los calcula la base.
- **Webhook:** valida la firma `x-signature`, es idempotente (un aviso repetido no duplica nada), detecta monto distinto, pago duplicado y pago que llega vencido, y atiende inscripciones y pedidos según el `external_reference`. La página de resultado concilia contra Mercado Pago por si el aviso todavía no llegó. Pagar no confirma el pedido: lo confirma Maggie. Los pagos que hay que devolver aparecen en el panel.
- **Demo operativa:** en producción con credenciales de una cuenta vendedora de prueba (ver [Decisiones](#decisiones)): se puede pagar de punta a punta con las tarjetas de prueba y el webhook llega.
- **Pruebas exhaustivas:** mock local de Mercado Pago para los e2e (sin credenciales reales) y pruebas manuales en el sandbox.

**Evidencia**

- PRs: [#13](https://github.com/trevisancata/home-bakery/pull/13) (pago con Mercado Pago), [#14](https://github.com/trevisancata/home-bakery/pull/14) y [#16](https://github.com/trevisancata/home-bakery/pull/16) (webhook), [#21](https://github.com/trevisancata/home-bakery/pull/21) (carrito y pedidos), [#22](https://github.com/trevisancata/home-bakery/pull/22) (medios de pago), [#37](https://github.com/trevisancata/home-bakery/pull/37) (pruebas manuales MP-16 a MP-42).
- Docs: [pagos.md](pagos.md) ([flujo](pagos.md#el-flujo), [estados](pagos.md#estados), [idempotencia y concurrencia](pagos.md#idempotencia-y-concurrencia), [credenciales por etapa](pagos.md#qué-credenciales-se-usan-en-cada-etapa)), [pruebas-mercadopago.md](pruebas-mercadopago.md) (configuración y tarjetas para la demo), [errores.md: 401 del webhook](errores.md#401-del-webhook-con-los-pagos-reales).
- Código: [`lib/mercadopago.ts`](../lib/mercadopago.ts), [`lib/pagos/`](../lib/pagos), [`app/api/v1/webhooks/mercadopago/route.ts`](../app/api/v1/webhooks/mercadopago/route.ts), [`app/api/v1/pedidos/route.ts`](../app/api/v1/pedidos/route.ts), [`app/api/v1/inscripciones/route.ts`](../app/api/v1/inscripciones/route.ts), [`e2e/support/mp-mock.ts`](../e2e/support/mp-mock.ts).
- Tests automáticos: `pagos.spec.ts` (21), `pedidos.spec.ts` (36), `carrito.spec.ts` (15), `pagos-unit.spec.ts` (21: firma, montos, preferencia, estados), `pedidos-unit.spec.ts` (35).
- Pruebas manuales en el sandbox: [plan de pruebas manuales](testing.md#plan-de-pruebas-manuales), con los pagos de MP-23 y MP-34 en producción.
- Capturas: [`checkout-mobile.png`](capturas/checkout-mobile.png), [`pedido-pagado-mobile.png`](capturas/pedido-pagado-mobile.png), [`pedido-transferencia-mobile.png`](capturas/pedido-transferencia-mobile.png), [`pedido-efectivo-mobile.png`](capturas/pedido-efectivo-mobile.png).

---

## Funcionalidad (40%)

**Nivel Excelente:** funcionalidad completa, robusta y alineada a los objetivos.

**Qué hace el proyecto.**

- **Completa:** el sitio cubre lo que necesita el negocio de Maggie: mostrar y vender sus productos (tienda, carrito, checkout con tres medios de pago, día y horario de retiro o envío), vender cupos de sus workshops (inscripción con pago y `.ics` para el calendario) y gestionarlo todo desde un panel (productos, precios, fotos, workshops, inscripciones, pedidos, devoluciones).
- **Robusta:** sin sobreventa de cupos con pedidos simultáneos, precios calculados por la base, webhook idempotente y con firma, rate limiting en el login, en las inscripciones y en los pedidos, reglas de negocio en la base (48 h de anticipación, franjas, efectivo solo con retiro) y errores sin filtrar información. 253 tests automáticos.
- **Alineada a los objetivos:** los pedidos los confirma Maggie (no hay stock: cada pedido se hornea), los avisos van por WhatsApp, que es como ella trabaja, y el panel se usa desde el celular. Los textos del negocio son los de Maggie y no hay datos inventados ([decisión](bitacora-ia.md#decisión-no-publicar-datos-inventados)).

**Evidencia**

- Flujos de punta a punta en e2e: compra con retiro → Mercado Pago → "¡Recibimos tu pago!" (`carrito.spec.ts`); inscripción → pago → webhook → reservada (`pagos.spec.ts`); pedido → aceptar → entregar desde el panel (`panel-pedidos.spec.ts`).
- Concurrencia: [por qué la inscripción va por una función](modelo-de-datos.md#por-qué-la-inscripción-va-por-una-función) y el test sin sobreventa de `api.spec.ts`; [idempotencia del webhook](pagos.md#idempotencia-y-concurrencia).
- Plan de pruebas manuales con resultados: [testing.md](testing.md#plan-de-pruebas-manuales).
- Bugs encontrados y resueltos: [testing.md: reporte de bugs](testing.md#reporte-de-bugs), [errores.md](errores.md).

## Código / Estructura (20%)

**Nivel Excelente:** código limpio, modular, estructurado y siguiendo buenas prácticas.

**Qué hace el proyecto.**

- **Estructura:** `app/` (rutas: sitio público, panel y API), `components/` (por sección, con componentes base), `lib/` (acceso a datos, servicio del panel, pagos, pedidos, validación, Supabase) y `data/` (todos los textos y datos del negocio; los componentes no tienen textos escritos adentro).
- **Buenas prácticas:** TypeScript estricto, los mismos esquemas zod en el formulario, la API y las Server Actions, código del servidor marcado con `server-only`, secretos solo del lado del servidor, funciones puras para la lógica testeable (fechas, precios, firma, sitemap) y migraciones compatibles hacia atrás para deployar sin cortes.
- **Calidad automática:** ESLint y `tsc` en el CI, commits chicos y PRs con plan, revisión y bitácora.

**Evidencia**

- Código: [`lib/`](../lib), [`lib/admin/`](../lib/admin), [`lib/pagos/`](../lib/pagos), [`lib/validation/`](../lib/validation), [`data/site.ts`](../data/site.ts), [`tsconfig.json`](../tsconfig.json) (`strict`), [`eslint.config.mjs`](../eslint.config.mjs).
- Ejemplos de lógica pura con unitarios: [`lib/pedidos/reglas.ts`](../lib/pedidos/reglas.ts) (`pedidos-unit.spec.ts`), [`lib/pagos/firma.ts`](../lib/pagos/firma.ts) (`pagos-unit.spec.ts`), [`lib/seo.ts`](../lib/seo.ts) (`seo-unit.spec.ts`).
- Migraciones compatibles hacia atrás: 0007, 0008 y 0011 ([README: Supabase](../README.md#supabase)).
- CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## Interfaz / Accesibilidad (15%)

**Nivel Excelente:** interfaz intuitiva, accesible y visualmente atractiva.

**Qué hace el proyecto.**

- **Accesible:** contraste AA medido (los tokens que no llegan a AA como texto se usan solo para fondos y bordes), foco visible, navegación con teclado, salto al contenido, `aria-live` en el carrusel, en el contador del carrito y en los avisos del panel, diálogos que enfocan la opción segura, alt en todas las fotos (obligatorio al subirlas desde el panel), áreas táctiles de al menos 44 px y respeto de `prefers-reduced-motion`.
- **Intuitiva:** "Cómo pedir" en tres pasos, avisos claros de anticipación, envío y temporada, carrito que avisa si cambió un precio; en el panel, pestañas según lo que le toca hacer a Maggie, Deshacer al pausar y botones de WhatsApp con el mensaje armado.
- **Atractiva:** identidad visual propia (paleta, tipografías y fotos de Maggie), fiel al mockup.

**Evidencia**

- Lighthouse: Accessibility 100 en todas las páginas públicas y del panel medidas, en mobile y desktop ([lighthouse.md](lighthouse.md)); contraste del texto sobre las portadas medido en 390 y 1440 px ([lighthouse.md](lighthouse.md#contraste-del-texto-sobre-las-portadas)).
- Tests: `header.spec.ts` (contraste ≥ 4,5:1 y foco ≥ 3:1), `carrusel.spec.ts` (teclado y `aria-live`), `menu-mobile.spec.ts` (Escape devuelve el foco), `inscripcion.spec.ts` y `panel.spec.ts` (foco en el primer error), `panel-pedidos.spec.ts` (390 px, botones de 44 px).
- Pruebas manuales de teclado, lector de pantalla y zoom: [plan de pruebas manuales](testing.md#plan-de-pruebas-manuales).
- Errores corregidos: [los diálogos enfocaban "Borrar definitivamente"](errores.md#los-diálogos-enfocaban-borrar-definitivamente).
- Capturas: [`docs/capturas/`](capturas); guía del panel escrita para Maggie: [guia-panel.md](guia-panel.md).

## Despliegue (15%)

**Nivel Excelente:** despliegue público, estable y accesible.

**Qué hace el proyecto.** Publicado en Vercel con HTTPS: deploy automático de `main` a producción y preview por PR. Las páginas públicas son estáticas con ISR, así que siguen respondiendo rápido aunque la base tarde. `/api/v1/health` para el monitoreo (sin tocar la base), Vercel Analytics y Speed Insights sin cookies, logs de las funciones, rollback documentado, sitemap y robots.txt, y un checklist para pasar a producción real.

**Evidencia**

- Sitio: [home-bakery-brown.vercel.app](https://home-bakery-brown.vercel.app); health: [`/api/v1/health`](https://home-bakery-brown.vercel.app/api/v1/health) (`{ status, version, commit }`).
- PR: [#29](https://github.com/trevisancata/home-bakery/pull/29) (DevOps).
- Docs: [deploy.md](deploy.md) ([variables de entorno](deploy.md#variables-de-entorno), [migraciones](deploy.md#migraciones), [dominio, DNS y SSL](deploy.md#dominio-dns-y-ssl), [logs y monitoreo](deploy.md#logs-y-monitoreo), [rollback](deploy.md#rollback), [checklist para pasar a producción real](deploy.md#checklist-para-pasar-a-producción-real)).
- Tests: el health en `api.spec.ts`; `seo.spec.ts` (sitemap y robots servidos por el build de producción).
- Pruebas manuales en producción: [plan de pruebas manuales](testing.md#plan-de-pruebas-manuales) (corrida del 04/11 al 09/11/2026).

## Documentación (10%)

**Nivel Excelente:** documentación completa, clara y alineada al proyecto.

**Qué hace el proyecto.** README con el stack, las páginas, la configuración paso a paso, la API y cómo correrlo; un documento por tema, al día con cada PR; una guía del panel escrita para Maggie; y el registro del proceso: bitácora del trabajo con IA y los errores con causa, solución y cómo evitar que se repitan.

**Evidencia**

- [README](../README.md): stack, páginas, sistema de diseño, Supabase y las once migraciones, Mercado Pago, API interna y de admin, panel, cómo correrlo y tests.
- Por tema: [modelo-de-datos.md](modelo-de-datos.md), [seguridad.md](seguridad.md), [pagos.md](pagos.md), [pruebas-mercadopago.md](pruebas-mercadopago.md), [testing.md](testing.md), [lighthouse.md](lighthouse.md), [deploy.md](deploy.md), [contenido-maggie.md](contenido-maggie.md).
- Para Maggie: [guia-panel.md](guia-panel.md).
- Proceso: [bitacora-ia.md](bitacora-ia.md) (qué se pidió, qué se hizo y qué decisiones se tomaron en cada PR), [errores.md](errores.md).
- Este documento, con la evidencia de cada ítem.

---

## Decisiones

- **Categorías fijas, no editables desde el panel.** Las siete categorías salen del seed y Maggie no las crea ni las edita: son la estructura de la tienda y del filtro, y cambian muy poco. Agregar una se hace con el seed o con SQL. Además, los tests comparan esa lista y no crean categorías de prueba, para no cambiar los filtros mientras corren otros tests en paralelo ([`e2e/api.spec.ts`](../e2e/api.spec.ts)). La base ya permite que la admin las escriba (RLS en [modelo-de-datos.md](modelo-de-datos.md#permisos-y-rls)), así que sumarlas al panel no pide migración.
- **Los e2e no corren en el CI.** Comparten la base de producción, el test del rate limit bloquea los logins 15 minutos y necesitan la secret key, que se saltea RLS. En el CI corren lint, `tsc`, build y los unitarios; los e2e, en local antes de mergear. Para correrlos en CI haría falta un proyecto de Supabase solo para tests ([deploy.md](deploy.md#por-qué-los-e2e-no-corren-en-ci)).
- **Credenciales de prueba de Mercado Pago hasta pasar a producción.** Hoy el sitio usa las credenciales de producción de una aplicación creada dentro de la cuenta vendedora de prueba: no cobran plata real. Al publicar se cambian, a la vez, el token y la clave del webhook por los de la cuenta de Maggie ([pagos.md](pagos.md#qué-credenciales-se-usan-en-cada-etapa), [checklist para pasar a producción](deploy.md#checklist-para-pasar-a-producción-real)).
- **Sin mails por falta de SMTP.** El SMTP por defecto de Supabase solo manda a los miembros del equipo y unos pocos mails por hora. Por eso el sitio no promete mails: los pedidos y las inscripciones se avisan por WhatsApp desde el panel, y el único mail es el de recuperar la contraseña del panel. Qué falta para tener mails: [README: TODO(SMTP)](../README.md#todosmtp-mails-de-producción), [errores.md](errores.md#las-plantillas-de-mail-no-se-pueden-editar-sin-smtp-propio).
