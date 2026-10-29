# Testing, depuración y calidad

Cómo se asegura la calidad de Home Bakery: qué se hace para que los errores no lleguen al código (QA), qué se hace para encontrarlos (QC), qué cubren los tests automáticos, qué se prueba a mano y cómo se depura una falla.

## Índice

- [QA y QC en este proyecto](#qa-y-qc-en-este-proyecto)
- [Comandos](#comandos)
- [Estrategia de los tests automáticos](#estrategia-de-los-tests-automáticos)
- [Plan de pruebas manuales](#plan-de-pruebas-manuales)
- [Reporte de bugs](#reporte-de-bugs)
- [Depuración](#depuración)
- [Cómo se hizo el test del menú mobile](#cómo-se-hizo-el-test-del-menú-mobile)

## QA y QC en este proyecto

- **QA (aseguramiento de la calidad)** es el proceso: lo que se hace **antes** para que el error no se cometa.
- **QC (control de calidad)** es la verificación del producto: lo que se hace **después** para encontrar el error que igual se coló.

### Prevenir (QA)

| Práctica | Qué evita | Dónde |
|---|---|---|
| Revisión de PRs | Que entre a `main` un cambio sin que nadie lo lea. Cada cambio va en su rama y su PR, y queda registrado en la bitácora | [bitacora-ia.md](bitacora-ia.md) |
| CI | Que se mergee algo que no compila o no pasa el lint. Corre `npm run lint` y `npm run build` en cada PR y en cada push a `main`. **No corre los e2e**: necesitan las claves de Supabase y escriben en la base, así que se corren en local antes de abrir el PR | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| TypeScript | Errores de tipos entre la base, la API y los componentes. El build falla si los tipos no cierran | `tsconfig.json` |
| Validación con zod | Que llegue a la base un pedido mal armado. Las APIs validan el cuerpo y responden 400 con los errores por campo; el formulario usa el mismo esquema | `lib/validation/` |
| RLS en Supabase | Que alguien escriba sin permiso aunque fallen las capas de arriba. Las políticas exigen `es_admin()` para escribir | [seguridad.md](seguridad.md) |
| Registro de errores | Repetir un error. Cada problema queda con su causa y "para que no se repita" | [errores.md](errores.md) |

### Detectar (QC)

| Práctica | Qué encuentra | Dónde |
|---|---|---|
| Tests e2e y de la API (Playwright) | Que un flujo deje de andar: tienda, inscripción, pago, webhook, panel, permisos | [`e2e/`](../e2e/) y abajo |
| Tests unitarios | Errores de lógica pura: firma del webhook, montos, temporadas, fechas | `*-unit.spec.ts`, `temporada.spec.ts` |
| Pruebas manuales | Lo que los tests no pueden: el pago real en el sandbox de Mercado Pago, el webhook desde MP, el uso con teclado y en un teléfono | [Plan de pruebas manuales](#plan-de-pruebas-manuales) y [pruebas-mercadopago.md](pruebas-mercadopago.md) |
| Lighthouse y axe-core | Problemas de accesibilidad, buenas prácticas, SEO y rendimiento (LCP) | [lighthouse.md](lighthouse.md) |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run test:e2e` | Corre toda la suite. Hace un build de producción y lo sirve en el puerto 3100, con Mercado Pago apuntando al mock |
| `npm run test:e2e -- e2e/tienda.spec.ts` | Corre un solo archivo |
| `npm run test:e2e:ui` | Abre el [modo UI](#modo-ui) de Playwright |
| `npm run test:e2e:report` | Abre el reporte html de la última corrida, con las capturas y los traces de las fallas |
| `npm run test:codegen` | Abre [Codegen](#codegen-grabar-un-test-nuevo) sobre `http://localhost:3000` (con `npm run dev` corriendo) |

**Requisitos:** las seis migraciones aplicadas y `SUPABASE_SECRET_KEY` en `.env.local`. Los tests crean y borran sus propias usuarias, productos, workshops y pagos de prueba. Mercado Pago es un mock local (`e2e/support/mp-mock.ts`), sin credenciales reales.

**Qué deja cada corrida** (los dos directorios están en `.gitignore`):

- en la terminal, el resumen (`list`);
- en `playwright-report/`, el reporte html. No se abre solo: se abre con `npm run test:e2e:report`;
- en `test-results/`, por cada test que falló, una captura de pantalla (`screenshot: "only-on-failure"`) y el trace (`trace: "retain-on-failure"`).

En CI el reporter es `github`, que marca las fallas como anotaciones en el PR.

## Estrategia de los tests automáticos

Playwright corre todo: los e2e con el navegador, los de la API con `request` y los unitarios, que importan funciones de `lib/` sin abrir ninguna página. Son 164 tests en 17 archivos (`npx playwright test --list`).

### Qué cubre cada archivo

**e2e y API** (con el build de producción y Supabase):

| Archivo | Tests | Qué cubre |
|---|---|---|
| `tienda.spec.ts` | 7 | Filtro por categoría y su reflejo en la URL, categoría inexistente, detalle, precio a confirmar y temporada, producto a medida por WhatsApp, producto oculto (404) |
| `menu-mobile.spec.ts` | 5 | Menú mobile: abrir, navegar y cerrarse; Escape con el foco de vuelta en el botón; clic afuera ([cómo se hizo](#cómo-se-hizo-el-test-del-menú-mobile)). Página actual: la home regenerada (`/index`) marca Inicio, y las subpáginas marcan su sección ([Bug 4](#bug-4-en-la-home-inicio-no-se-marca-como-página-actual)) |
| `carrito.spec.ts` | 10 | Carrito en el navegador: agregar con tamaño y sabor (sin sabor no deja), contador accesible del header, editar, recargar y quitar; producto desactivado o con otro precio después de agregarlo; carrito guardado roto; a medida por WhatsApp. Checkout con retiro → mock de MP → "¡Recibimos tu pago!" y carrito vacío; envío desde $ 400.000 con dirección; domingo avisa al elegirlo. Resultado pendiente y rechazado con "Probar de nuevo"; 404 con un id inválido |
| `pedidos.spec.ts` | 21 | `POST /api/v1/pedidos` y la base: precios de la base aunque el cliente mande otros, preferencia con un ítem por línea, envío (total mínimo y dirección), domingo / fuera de horario / antes de 48 h / más de 30 días, productos inactivos, a medida, fuera de temporada o sin precio, sabor y decoración inválidos, `Origin` ajeno (403), 502 si MP falla, clave publishable sin acceso. Webhook: `pagado` (nunca aceptado), idempotente, monto distinto, pago duplicado, vencido. `aceptar_pedido` / `rechazar_pedido` con admin, sin rol y sin sesión, y la devolución con `marcar_devuelto` |
| `carrusel.spec.ts` | 3 | Carrusel de la portada: avance automático y pausa, manejo con teclado, movimiento reducido |
| `inscripcion.spec.ts` | 3 | Formulario: errores por campo con foco en el primero, envío y paso del pago, workshops de ejemplo sin inscripción |
| `api.spec.ts` | 24 | API pública `/api/v1`: categorías, productos (filtros y 400), detalle (404), workshops, inscripciones (400, 404, 409, sin sobreventa con pedidos simultáneos), redirecciones 308 de las rutas viejas |
| `pagos.spec.ts` | 21 | Preferencia con el total de la base (`external_reference` `inscripcion:<id>`), 422 sin precio, 502 si MP falla; webhook (aprobado, referencia vieja sin prefijo, rechazado, monto distinto, duplicados, firma inválida, pagos ajenos); vencimiento y último lugar; página de resultado; inscripción y devoluciones en el panel |
| `admin.spec.ts` | 11 | Permisos (sin sesión, sin rol, admin), login incorrecto, validación y saneo de la API de admin, origen cruzado (403), productos, fotos en Storage, inscripciones y workshops |
| `panel.spec.ts` | 7 | Panel de Maggie: precio en línea, pausar y deshacer, tope de 4 destacados, validación con foco, producto con foto, workshop con inscripta, marcar devolución |
| `cerrar-sesion.spec.ts` | 1 | Cerrar sesión cierra solo la sesión actual y `/admin` vuelve a pedir login |
| `rate-limit.spec.ts` | 1 | Después de 5 intentos fallidos el login se bloquea, aunque la contraseña sea correcta |
| `auth.setup.ts` | 2 | No es un test: ingresa con las usuarias de prueba y guarda la sesión en `e2e/.auth/` |

**Unitarios** (sin navegador ni base):

| Archivo | Tests | Qué cubre |
|---|---|---|
| `pagos-unit.spec.ts` | 21 | Firma `x-signature` del webhook, cálculo del monto (redondeo al centavo), preferencia de Checkout Pro (sin `notification_url`), estados de MP, URL del sitio, `.ics`, rate limiter, qué ve quien vuelve de MP |
| `panel-unit.spec.ts` | 6 | Fecha y hora de Buenos Aires, número de WhatsApp, precios escritos como en Argentina |
| `temporada.spec.ts` | 5 | Temporada de un producto: rangos dentro del año y cruzando el año, mes de Buenos Aires, texto del rango |
| `pedidos-unit.spec.ts` | 16 | Pedidos: franjas por día, inicio de la franja en hora de Buenos Aires, 48 h hasta el inicio, máximo 30 días, mínimo del envío; `external_reference` (con prefijo y el formato viejo); preferencia del pedido; qué ve quien vuelve de pagar; esquema del pedido (descarta precios del cliente); carrito guardado (suma de líneas, versión y datos rotos) |

### Mock de Mercado Pago

Los e2e nunca llaman a Mercado Pago. `playwright.config.ts` levanta `e2e/support/mp-mock.ts` en el puerto 3101 y le pasa al servidor `MP_API_BASE_URL` apuntando ahí, con un token `TEST-e2e`. Las variables del proceso le ganan a `.env.local`, así que las credenciales reales no se usan.

- El mock crea preferencias y devuelve pagos con el estado que el test le pide; también puede fallar a propósito (el caso del 502).
- El secret del webhook se genera en cada corrida (`E2E_MP_WEBHOOK_SECRET`): el servidor lo usa para validar y los tests para firmar los avisos.
- Lo que el mock no puede probar (el checkout real, la firma de MP, la entrega del aviso) se prueba a mano: [pruebas-mercadopago.md](pruebas-mercadopago.md).

### Los e2e no dependen de los datos de producción

Los e2e corren contra el mismo proyecto de Supabase que el sitio, y el catálogo lo edita Maggie desde el panel: precios (hoy, $ 10 en todos hasta cargar los reales), destacados, productos ocultos, fotos. Un test que lee esos datos falla cuando ella cambia algo, aunque el código esté bien. Pasó con un precio y con una fecha de ejemplo vencida (ver [errores.md](errores.md#tests-atados-a-los-precios-y-destacados-reales)).

Por eso:
- **Cada test crea lo que necesita y lo borra al terminar**, con slug `e2e-…`:
  - workshops con el fixture `workshop` o `crearWorkshopDePrueba({ esEjemplo })`, y con `crearWorkshopPorApi` cuando tienen que aparecer en `/workshops` (`e2e/support/supabase.ts`);
  - productos con `crearProductoDePrueba` y `borrarProductoDePrueba`, o con `crearProductoPorApi` y `borrarProductoPorApi` (`e2e/support/productos.ts`);
  - pedidos por la API pública con `pedir` y un email `e2e-pedido-…@example.com` (`e2e/support/pedidos.ts`). Los borra el teardown, con sus pagos, antes que los productos. Las fechas salen de `turnoValido()`, calculado con las mismas reglas que el checkout, así que los tests no dependen del día en que corren.
- **Se comprueba lo propio, no totales:** que el producto de prueba aparece o no aparece, nunca cuántos productos hay.
- **Listados estáticos:** `/tienda` y `/workshops` son estáticas (ISR). Para que algo aparezca en el listado se crea con la API de admin, que revalida la página, y el test la abre con `abrirHastaVer`: con otros tests revalidando en paralelo, puede tardar un momento en verse. Para la API pública, el detalle y la inscripción alcanza con insertarlo en la base.
- **Datos fijos:** las categorías son lo único real que se usa. Salen del seed, Maggie no las edita desde el panel, y una categoría de prueba aparecería en los filtros mientras corren los demás tests.
- **El teardown** borra al final todo lo `e2e-…` que haya quedado si un test se cortó.
- **Ids de pago únicos entre workers:** `nuevoPagoId()` lleva el pid del worker. Si dos workers generaran el mismo id, el mock pisaría un pago con otro ([errores.md](errores.md#dos-workers-generaban-el-mismo-id-de-pago)).

### El rate limit va al final

`rate-limit.spec.ts` hace 5 logins fallidos y deja **bloqueados los logins desde esta IP durante 15 minutos**. Si corriera en paralelo con los demás, los tests del panel no podrían ingresar. Por eso está en su propio proyecto, `rate-limit`, que depende de `chromium` y corre cuando terminan todos.

Consecuencias:
- si falla cualquier test de `chromium`, Playwright no corre el de `rate-limit` (pasó en el PR #17, ver la [bitácora](bitacora-ia.md#pr-17--contenido-de-maggie-2-featcontenido-maggie-2));
- después de una corrida completa, no se puede volver a correr la suite (ni ingresar al panel en local) hasta que pasen los 15 minutos. Para repetir un archivo, correrlo solo: `npm run test:e2e -- e2e/tienda.spec.ts --project=chromium`.

## Plan de pruebas manuales

Casos para correr a mano antes de publicar un cambio grande o al pasar a las credenciales de Maggie. Los de pago se hacen con la [configuración del sandbox](pruebas-mercadopago.md#configuración-que-funciona), en una ventana de incógnito y con la cuenta compradora de prueba. Las tarjetas están en [pruebas-mercadopago.md](pruebas-mercadopago.md#2-tarjetas-de-prueba-argentina); el **titular** decide el resultado (`APRO`, `OTHE`, `CONT`).

**Automatizado** indica si un e2e cubre lo mismo (con el mock de MP en el caso de los pagos). "Resultado obtenido" y "Estado" solo llevan lo que quedó registrado en la documentación; el resto se completa al correr el caso.

La corrida del 28/10/2026 fue sobre el sitio publicado. Cada resultado dice quién ejecutó el caso: Claude en el navegador integrado (MP-01 a MP-04, MP-14 y, de MP-15, el salto al contenido y el carrusel) o Catalina (el resto).

| ID | Módulo | Precondición | Pasos | Resultado esperado | Resultado obtenido | Estado | Automatizado |
|---|---|---|---|---|---|---|---|
| MP-01 | Tienda | Al menos dos categorías con productos | Abrir `/tienda`, elegir una categoría | Se ven solo sus productos y la URL lleva `?categoria=…`; al recargar, sigue filtrada | 28/10/2026, Claude en el navegador integrado: Budines filtra 6 productos, la URL lleva `?categoria=budines` y sigue filtrada al recargar | Pasó | Sí (`tienda.spec.ts`) |
| MP-02 | Tienda | Un producto sin precio y con temporada | Abrir su detalle desde la tarjeta | "Precio a confirmar" y el rango de la temporada | 28/10/2026, Claude en el navegador integrado: la temporada se ve ("Solo en temporada: de septiembre a febrero"); "Precio a confirmar" no se pudo probar porque todos los productos tienen precio ($ 10). Lo cubre el e2e | Parcial | Sí (`tienda.spec.ts`) |
| MP-03 | Workshop | Un workshop de ejemplo | Abrir `/workshops` y su inscripción | Aviso "Fecha de ejemplo…" y sin formulario para reservar | 28/10/2026, Claude en el navegador integrado: los ejemplos muestran el aviso y no tienen formulario, también entrando directo a `/inscripcion` | Pasó | Sí (`inscripcion.spec.ts`) |
| MP-04 | Inscripción | Workshop activo con precio y cupo | Enviar el formulario vacío; después, un email sin `@` | Errores por campo, foco en el primero; el error del email se anuncia como descripción del campo | 28/10/2026, Claude en el navegador integrado: errores por campo y foco en el primero; el email sin `@` muestra su error en el campo | Pasó | Sí (`inscripcion.spec.ts`) |
| MP-05 | Pago | Sandbox configurado, workshop de prueba | Inscribirse, "Pagar con Mercado Pago", tarjeta con titular `APRO` | "¡Tu lugar está reservado!", total pagado, `.ics`; en `/admin`, "Reservada" y pago "Aprobado" | Verificado el 22/10/2026: pago conciliado (ver [errores.md](errores.md#401-del-webhook-con-las-credenciales-test)) | Pasó | Parcial (`pagos.spec.ts`, con mock) |
| MP-06 | Pago | Igual que MP-05 | Pagar con titular `OTHE` y volver al sitio | "El pago no se aprobó" y "Probar de nuevo"; la inscripción sigue pendiente; reintento con `APRO` → reservada | 28/10/2026, Catalina: con titular `OTHE`, "El pago no se aprobó" y "Probar de nuevo"; la inscripción quedó pendiente. El reintento con `APRO` no quedó registrado | Pasó | Parcial (`pagos.spec.ts`, con mock) |
| MP-07 | Pago | Igual que MP-05 | Pagar con titular `CONT` | "Estamos esperando la confirmación del pago"; se refresca cada 5 s durante 1 minuto | 28/10/2026, Catalina: con titular `CONT`, "Estamos esperando la confirmación del pago". El refresco cada 5 s no quedó registrado | Pasó | Parcial (`pagos.spec.ts`, con mock) |
| MP-08 | Webhook | Webhook en Modo productivo, deploy en producción | Pagar con `APRO`; mirar el historial de notificaciones de MP | El aviso `payment.created` se entrega con 200 | Verificado el 22/10/2026: 200 y pago conciliado | Pasó | Parcial (`pagos.spec.ts` firma y procesa avisos con el mock) |
| MP-09 | Webhook | Panel de MP, modo de prueba | "Simular notificación" | 200 | Verificado el 22/10/2026: 200 (ver [errores.md](errores.md#401-del-webhook-con-los-pagos-reales)) | Pasó | No |
| MP-10 | Panel: login | Usuaria admin | Ingresar con contraseña incorrecta; después, con la correcta | Mensaje genérico con foco; con la correcta, entra a `/admin` | 28/10/2026, Catalina: con la contraseña incorrecta, mensaje genérico; con la correcta, entra a `/admin` | Pasó | Sí (`admin.spec.ts`) |
| MP-11 | Panel: productos | Sesión de admin | Editar el precio de un producto en línea | Se guarda y la tienda muestra el precio nuevo | 28/10/2026, Catalina: el precio editado se guarda y se ve en la tienda | Pasó | Sí (`panel.spec.ts`) |
| MP-12 | Panel: inscripciones | Una inscripción reservada | Cambiarle el estado desde `/admin/inscripciones` | El estado cambia y el cupo se respeta | 28/10/2026, Catalina: el estado de la inscripción cambia desde `/admin/inscripciones` | Pasó | Sí (`panel.spec.ts`, `admin.spec.ts`) |
| MP-13 | Panel: devolución | Un pago en "Para devolver" | Hacer la devolución en MP y "Marcar como devuelto" (con confirmación) | Pasa a los devueltos y un aviso repetido no lo vuelve a marcar | 28/10/2026, Catalina: no se corrió, no había un pago en "Para devolver" | No ejecutado | Sí (`panel.spec.ts`) |
| MP-14 | Mobile | Teléfono real o 390 px | Abrir "Menú", ir a Tienda; abrir de nuevo y cerrar con Escape y tocando afuera | El menú se abre debajo del header, marca la página actual y se cierra en los tres casos | 28/10/2026, Claude en el navegador integrado: abre debajo del header, navega a Tienda y se cierra en los tres casos. En la home, "Inicio" no tiene `aria-current="page"` (en `/tienda`, "Tienda" sí): [Bug 4](#bug-4-en-la-home-inicio-no-se-marca-como-página-actual) | Pasó con bug ([Bug 4](#bug-4-en-la-home-inicio-no-se-marca-como-página-actual)) | Sí (`menu-mobile.spec.ts`) |
| MP-15 | Accesibilidad | Solo teclado, sin mouse | Desde `/`: Tab hasta "Saltar al contenido" y Enter; recorrer el carrusel; inscribirse a un workshop; en el panel, abrir un diálogo de borrar | Foco siempre visible; el salto lleva al contenido; el carrusel se maneja con Enter y Espacio; el diálogo enfoca la opción segura | 28/10/2026, Claude en el navegador integrado: Tab hasta "Saltar al contenido" con foco visible y Enter lleva a `main#contenido`; el carrusel se maneja con Enter y Espacio y se pausa con Enter. 28/10/2026, Catalina: la inscripción se completa solo con teclado y el diálogo de borrar del panel enfoca la opción segura | Pasó | Parcial (carrusel e inscripción; el diálogo, en `panel.spec.ts`) |
| MP-16 | Carrito | Un producto que se pueda pedir, con sabores | En su detalle, tocar "Agregar al pedido" sin elegir sabor; después elegir uno y agregar 2 | Sin sabor: "Elegí un sabor." con foco en el campo. Con sabor: "¡Listo! Lo agregamos a tu pedido." y el ícono del carrito muestra 2 | TODO: correrlo | Sin correr | Sí (`carrito.spec.ts`) |
| MP-17 | Carrito | Un producto en el carrito | Abrir el sitio en dos pestañas; agregar otro producto en una | El contador de la otra pestaña se actualiza solo (evento `storage`) | TODO: correrlo | Sin correr | No |
| MP-18 | Carrito | DevTools abierto | En Application → Local Storage, poner `homebakery:carrito` en `{roto` y recargar `/carrito` | "Todavía no agregaste nada.", sin errores en la consola | TODO: correrlo | Sin correr | Sí (`carrito.spec.ts`) |
| MP-19 | Carrito: accesibilidad | VoiceOver (o NVDA) | Agregar un producto desde su detalle; después, ir al ícono del carrito con Tab | Anuncia "Agregaste … al pedido."; el ícono se lee "Carrito, N productos" | TODO: correrlo | Sin correr | Parcial (`carrito.spec.ts` verifica el texto y el nombre accesible, no la lectura) |
| MP-20 | Checkout: accesibilidad | Solo teclado | Completar el checkout con Tab, flechas y Enter; enviar con un campo vacío | Foco siempre visible; el foco va al primer campo con error y el error se lee como descripción | TODO: correrlo | Sin correr | Parcial (`carrito.spec.ts`, foco en la dirección) |
| MP-21 | Checkout: día y horario | Teléfono real (iPhone o Android) | Elegir un domingo; después un sábado; después un día a menos de 48 h | Selector de fecha nativo, sin scroll horizontal. Domingo: aviso al elegirlo y horario deshabilitado. Sábado: solo "9 a 13 h". A menos de 48 h: las franjas que no llegan aparecen deshabilitadas | TODO: correrlo | Sin correr | Parcial (`carrito.spec.ts` el domingo; `pedidos.spec.ts` las reglas en la API) |
| MP-22 | Checkout: envío | Carrito con menos de $ 400.000; después con más | Mirar la opción "Envío a domicilio" | Con menos: deshabilitada, con "El envío es solo para pedidos desde $ 400.000.". Con más: se puede elegir, pide dirección y localidad y aclara que no tiene cargo | TODO: correrlo | Sin correr | Sí (`carrito.spec.ts`, `pedidos.spec.ts`) |
| MP-23 | Pedido: pago | Sandbox configurado y migración 0007 corrida | Seguir "Pedido de la tienda" en [pruebas-mercadopago.md](pruebas-mercadopago.md#pedido-de-la-tienda) con `APRO`; después otro con `OTHE` | `APRO`: "¡Recibimos tu pago!", número de pedido, carrito vacío; en Supabase el pedido queda `pagado` (no `aceptado`) y el pago tiene `pedido_id`. `OTHE`: "El pago no se aprobó" y "Probar de nuevo" | TODO: correrlo | Sin correr | Parcial (`carrito.spec.ts`, `pedidos.spec.ts`, con mock) |

## Reporte de bugs

### Plantilla

```markdown
### <Título: qué falla, dónde>

- **Entorno:** producción / preview / local · navegador · dispositivo · rama o commit
- **Severidad:** crítica / alta / media / baja (cuánto daño hace)
- **Prioridad:** alta / media / baja (qué tan pronto hay que arreglarlo)

**Pasos para reproducir:**
1. …
2. …

**Resultado esperado:** …
**Resultado obtenido:** …

**Evidencia:** logs, capturas, trace de Playwright, respuesta de la red.
**Causa:** …
**Solución:** … (PR #…)
```

**Severidad** es el impacto (¿se pierde plata? ¿se rompe un flujo?) y **prioridad**, la urgencia. Suelen ir juntas, pero no siempre: un test que falla sin que el sitio esté roto tiene severidad baja y prioridad alta, porque bloquea los PRs.

Los bugs 1 a 3 salen de [errores.md](errores.md); el 4, del plan de pruebas manuales (MP-14).

### Bug 1: el webhook de Mercado Pago respondía 401 a los pagos reales

- **Entorno:** producción (Vercel), webhook `POST /api/v1/webhooks/mercadopago`, pagos del sandbox con la cuenta compradora de prueba
- **Severidad:** alta. Sin la conciliación de la página de resultado, un pago aprobado habría quedado sin registrar
- **Prioridad:** alta

**Pasos para reproducir:**
1. Configurar `MP_ACCESS_TOKEN` con las credenciales `TEST-…` y `MP_WEBHOOK_SECRET` con la clave del panel.
2. Inscribirse a un workshop y pagar con titular `APRO`.
3. Mirar los logs de Vercel y el historial de notificaciones de MP.

**Resultado esperado:** el aviso se valida y responde 200.
**Resultado obtenido:** 401 con "Webhook de Mercado Pago con firma inválida (SignatureMismatch)".

**Evidencia:**
- logs de Vercel: los avisos llegaban con `?data.id=…&type=payment&source_news=webhooks`;
- "Simular notificación" en el panel de MP respondía 200, así que la clave y la validación estaban bien.

**Causa:** dos cosas, en dos pasos:
1. la preferencia mandaba `notification_url`, y esos avisos no validaban con la clave del panel (PR #14);
2. con las credenciales `TEST-…`, la firma de los avisos de los pagos del sandbox no validaba (PR #16).

**Solución:**
- PR #14: sin `notification_url` en la preferencia, la clave con `trim()` y tests unitarios de las tres cosas.
- PR #16: una aplicación dentro de la cuenta vendedora de prueba, con sus credenciales de producción (`APP_USR-…`) y el webhook en Modo productivo.
- Verificado: el aviso se entregó con 200 y el pago quedó conciliado.

### Bug 2: un test fallaba porque dependía del precio real de un producto

- **Entorno:** local, `npm run test:e2e`, rama `feat/contenido-maggie-2`
- **Severidad:** baja. El sitio andaba bien
- **Prioridad:** alta. Hacía fallar la suite y, por la dependencia entre proyectos, el test de `rate-limit` no corría

**Pasos para reproducir:**
1. Desde el panel, poner $ 10 a "Tarta de frutillas" (lo había pedido Maggie para todos los productos).
2. Correr `npm run test:e2e -- e2e/tienda.spec.ts`.

**Resultado esperado:** el test "detalle con precio a confirmar y temporada" pasa.
**Resultado obtenido:** falla: esperaba "Precio a confirmar" y la página mostraba "$ 10".

**Evidencia:** la salida de Playwright con el texto esperado y el recibido; el proyecto `rate-limit` aparecía como no corrido.
**Causa:** el test leía un producto real, que Maggie edita desde el panel. Revisando los demás, "filtra por destacados" dependía de los destacados reales y, sin ninguno, pasaba sin probar nada.
**Solución (PR #17):** `crearProductoDePrueba` y `borrarProductoDePrueba` en `e2e/support/productos.ts`; cada test crea su producto `e2e-…`, lo verifica y lo borra. Ver [Los e2e no dependen de los datos de producción](#los-e2e-no-dependen-de-los-datos-de-producción).

### Bug 3: falla intermitente, un workshop recién creado no aparecía en /workshops

- **Entorno:** local, `npm run test:e2e`, rama `test/e2e-independientes`
- **Severidad:** baja. Para quien visita el sitio, el workshop aparece en la visita siguiente
- **Prioridad:** alta. Un test intermitente hace que nadie confíe en la suite

**Pasos para reproducir:**
1. Correr la suite completa (muchos tests revalidan `/workshops` en paralelo).
2. Repetir: falla más o menos 1 vez de cada 3.

**Resultado esperado:** el workshop creado con la API de admin aparece en `/workshops`.
**Resultado obtenido:** la página mostraba los otros workshops de prueba, pero no ese.

**Evidencia:** la captura y el trace de la falla: la página se había servido con una versión anterior al alta.
**Causa:** `/workshops` es estática (ISR). Una regeneración que empezó antes del alta puede terminar después y dejar por un momento la versión vieja.
**Solución (PR #18):** `abrirHastaVer` (`e2e/support/supabase.ts`) recarga la página hasta que se ve lo que creó el test, con un tope de 20 s. Con 5 repeticiones, 172 de 172.

### Bug 4: en la home, "Inicio" no se marca como página actual

- **Entorno:** producción (Vercel), home `/`, menú mobile (390 px) y de escritorio, rama `main`
- **Severidad:** baja. La navegación anda; un lector de pantalla no anuncia "página actual" en la home y "Inicio" no se ve resaltado
- **Prioridad:** media

**Pasos para reproducir:**
1. Abrir `/` en el sitio publicado (después de que se haya regenerado, por ejemplo tras un cambio desde el panel).
2. Abrir "Menú".
3. Inspeccionar el link "Inicio".

**Resultado esperado:** "Inicio" tiene `aria-current="page"`, como "Tienda" en `/tienda`.
**Resultado obtenido:** ningún link del menú tiene `aria-current`, ni en el HTML que manda el servidor ni después de hidratar.

**Evidencia:**
- `curl` de `/` en producción: los links "Inicio" no tienen `aria-current`; en `/tienda`, "Tienda" sí;
- el payload RSC de esa home trae la URL canónica `"c":["","index"]`; el de un `next build` local, `"c":["",""]` y la home sale bien;
- regenerando la home con `next start` en local, sigue saliendo `"c":["",""]`: pasa solo con la regeneración de Vercel. Por eso el e2e del menú (que corre contra un build nuevo) pasaba.

**Causa:** el Header comparaba `pathname === "/"` para "Inicio". Cuando Vercel regenera la home (ISR, `revalidate = 300` y `revalidatePath("/")` desde el panel), `usePathname()` devuelve `"/index"`, así que la comparación daba falso.
**Solución (PR #20):** `esPaginaActual` (`lib/navegacion.ts`) toma `"/index"` como el inicio y marca las secciones solo en su ruta o sus subpáginas (`/tienda/…`, no `/tiendas`). El Header la usa en los dos menús y `menu-mobile.spec.ts` la prueba con `"/index"`. Falta verificarlo en producción después del deploy.

## Depuración

### Trace Viewer: ver qué pasó en una falla

Cada test que falla deja un `trace.zip` en `test-results/<nombre-del-test>/`. Tiene cada acción con una captura del DOM antes y después, la red, la consola y el código del test.

1. Correr la suite o el archivo: `npm run test:e2e -- e2e/tienda.spec.ts --project=chromium`.
2. Abrir el reporte: `npm run test:e2e:report`, entrar al test que falló y tocar el trace. También se puede abrir directo:

   ```bash
   npx playwright show-trace test-results/<carpeta-del-test>/trace.zip
   ```

3. En el Trace Viewer:
   - en la línea de tiempo, buscar la acción en rojo y mirar el DOM en ese momento ("Before" / "After");
   - en **Network**, ver qué devolvió la API;
   - en **Console**, los errores del navegador.

Para tener el trace de un test que pasa (por ejemplo, para compararlo con el que falla): `npm run test:e2e -- <archivo> --trace on`.

### Codegen: grabar un test nuevo

Codegen abre un navegador y escribe el código de Playwright a medida que se usa el sitio.

1. En una terminal: `npm run dev`.
2. En otra: `npm run test:codegen` (abre `http://localhost:3000`).
3. Usar el sitio como lo haría una persona. Codegen elige locators por rol y por nombre accesible (`getByRole("button", { name: "Menú" })`), los mismos que usan los tests de este proyecto.
4. Con los botones de la barra de Codegen se agregan aserciones: "Assert visibility", "Assert text", "Assert value".
5. Copiar el código a un archivo nuevo en `e2e/` y limpiarlo:
   - sacar el `page.goto("http://localhost:3000/…")` absoluto y dejar la ruta (`page.goto("/tienda")`): la suite corre en el puerto 3100;
   - agrupar con `test.describe` y nombres en español que digan qué se comprueba;
   - cambiar las aserciones de texto exacto por las que importan (`aria-expanded`, `aria-current`, la URL);
   - si el test necesita datos, crearlos con los helpers de `e2e/support/`, nunca usar los reales.

Para grabar en tamaño de teléfono: `npm run test:codegen -- --viewport-size=390,844`.

### Modo UI

`npm run test:e2e:ui` abre la interfaz de Playwright: la lista de tests, el navegador y la línea de tiempo en una sola ventana.

- Correr un test con ▶ y ver cada paso; al tocar una acción, se ve el DOM en ese momento.
- **Watch** (el ojo) vuelve a correr el test cuando se guarda el archivo.
- **Pick locator** encuentra el locator de un elemento haciendo clic sobre él.
- Hace el mismo build que `npm run test:e2e`, así que tarda en arrancar. Si se corre `rate-limit.spec.ts` desde acá, bloquea los logins por 15 minutos.

### Ejemplo con DevTools: una inscripción que no avanza

Caso: alguien escribe "el formulario de inscripción no me deja seguir", sin más datos.

1. Con `npm run dev`, abrir `/workshops/<slug>/inscripcion` y las DevTools (Cmd+Opción+I).
2. **Network:** filtrar por `inscripciones` y enviar el formulario.
   - **No aparece ningún pedido:** la validación del navegador frenó el envío. Los errores tienen que estar en pantalla, junto a cada campo.
   - **`POST /api/v1/inscripciones` con 400:** en **Response**, `{ "error": { "message": …, "fields": { … } } }` dice qué campo rechazó el servidor. En **Payload** se ve qué se mandó (`workshopSlug`, `name`, `whatsapp`, `email`, `spots`, `acceptsPolicy`…).
   - **409:** `error.spotsLeft` dice cuántos lugares quedan; se llenó el cupo mientras la persona completaba el formulario.
   - **422:** el workshop no tiene precio cargado.
   - **429:** el rate limit de inscripciones (varias seguidas desde la misma IP).
   - **502:** Mercado Pago no respondió. Mirar en la terminal de `npm run dev` el error del servidor.
   - **201:** `data.initPoint` es el link de Checkout Pro. Si con eso el sitio no pasa al pago, el problema está en el cliente.
3. **Console:** errores de JavaScript o de hidratación del formulario. Para probar la API sin el formulario, desde la consola del mismo sitio:

   ```js
   await fetch("/api/v1/inscripciones", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ workshopSlug: "<slug>", email: "sin-arroba" }),
   }).then((r) => r.json());
   ```

   Devuelve el 400 con todos los campos que faltan y el mensaje del email, sin crear nada.

Con el status y la respuesta se sabe si el problema está en el formulario, en la API o en Mercado Pago, antes de abrir el código.

## Cómo se hizo el test del menú mobile

El filtro de categorías de la tienda ya estaba cubierto en `tienda.spec.ts`; el menú mobile del header (`components/Header.tsx`), no. El test está en `e2e/menu-mobile.spec.ts`.

### 1. La grabación con Codegen

Catalina grabó el recorrido con `npm run test:codegen`: abrir el menú, ir a la tienda, abrirlo de nuevo y cerrarlo con Escape. Codegen generó esto:

```ts
import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByText('Saltar al contenido48 h de').press('F12');
  await page.getByText('Saltar al contenido48 h de').press('F12');
  await page.getByText('Saltar al contenido48 h de').press('F12');
  await page.getByText('Saltar al contenido48 h de').press('F12');
  await page.getByText('Saltar al contenido48 h de').press('F12');
  await page.getByRole('button', { name: 'Menú' }).click();
  await page.getByRole('link', { name: 'Tienda', exact: true }).click();
  await page.getByRole('button', { name: 'Menú' }).click();
  await page.getByRole('button', { name: 'Menú' }).press('Escape');
});
```

### 2. Por qué una grabación no se commitea tal cual

Codegen anota **todo** lo que pasa en el navegador, no lo que se quería probar. Esta grabación tiene los problemas típicos:

| Problema | En la grabación | Qué pasa si se deja |
|---|---|---|
| **Pasos accidentales** | Las 5 líneas de `press('F12')`: fue para abrir las DevTools, y Codegen las grabó como teclas sobre la página | El test hace cosas que nadie quiso probar, y quien lo lea no sabe por qué están |
| **Locator frágil** | `getByText('Saltar al contenido48 h de')`: el texto de un contenedor que junta el link "Saltar al contenido" con el comienzo de la barra de avisos | Si cambia el texto de la barra, el test falla en la línea 2, antes de llegar al menú, aunque el menú ande bien |
| **URL absoluta** | `page.goto('http://localhost:3000/')` | La suite levanta el sitio en el puerto 3100 (`baseURL`): con la URL fija, el test va al servidor de desarrollo o no encuentra nada |
| **Nombre genérico** | `test('test', …)` | En el reporte, una falla de "test" no dice qué se rompió |
| **Sin viewport mobile** | No fija el tamaño de pantalla | El botón "Menú" solo existe debajo de `md`. Al grabar, la ventana era angosta; con el viewport de "Desktop Chrome" de la suite (1280 px) el botón está oculto y el `click` falla por timeout |
| **Sin aserciones** | Solo clics y teclas | El test pasa aunque el menú no se abra, no navegue o no se cierre: solo falla si un elemento no existe |

### 3. Qué se cambió a mano

`e2e/menu-mobile.spec.ts` parte del mismo recorrido, con estos cambios:

- **Se sacaron las 5 líneas de F12** y el locator `getByText` que solo usaban ellas.
- **Rutas relativas** (`/`, `/tienda`), que usan el `baseURL` de la config.
- **`test.use({ viewport: { width: 390, height: 844 } })`**, el ancho de un teléfono.
- **Nombres que dicen qué se comprueba**, agrupados en `test.describe("Menú mobile")`, y **un test por comportamiento**, así una falla dice cuál se rompió:
  - "se abre, navega a la tienda y se cierra solo";
  - "Escape lo cierra y devuelve el foco al botón";
  - "un clic afuera lo cierra" (Codegen no lo grabó).
- **El link se busca dentro del menú:** `page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Tienda" })`. La grabación necesitaba `exact: true` porque buscaba en toda la página; acotado al menú, solo hay un link "Tienda" y no importa qué otros links tenga la página.
- **Aserciones**, que la grabación no tenía:
  - `aria-expanded` del botón, en `"true"` al abrir y `"false"` al cerrar;
  - los cuatro links del menú, en orden;
  - `aria-current="page"` en el link de la página actual (Inicio y, después de navegar, Tienda);
  - la URL `/tienda`, y el menú oculto después de navegar.
- **Escape desde adentro del menú:** la grabación lo apretaba con el foco en el botón. El test lo aprieta con el foco en un link del menú, que es el caso real con teclado, y comprueba que el foco vuelve al botón (`toBeFocused`).

### 4. Cómo volver a grabarlo

```bash
npm run dev
npm run test:codegen -- --viewport-size=390,844
```

Con `--viewport-size` la grabación ya sale en tamaño de teléfono. Para abrir las DevTools mientras se graba, usar el menú del navegador, no F12, o borrar después las líneas que se graben. Y antes de commitear, la limpieza del paso 5 de [Codegen](#codegen-grabar-un-test-nuevo).

No usa datos de la base, así que no crea ni borra nada.
