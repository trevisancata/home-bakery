# Bitácora de trabajo con IA

Registro de lo que se le pidió a Claude Code en cada PR, qué entregó y qué ajustes hicieron falta. Los prompts están resumidos; los ajustes son los que pidió Catalina al revisar el plan o el PR. Los problemas y cómo se resolvieron están en [errores.md](errores.md).

## 29/09/2026

Cuatro PRs en el día: diseño de marca, fidelidad al mockup, workshops y Maggie, e inscripción a workshops. En todos se trabajó igual: Claude Code muestra un plan, Catalina lo aprueba o lo corrige, y después vienen commits chicos, lint y build en verde, y el PR con `gh` sin mergear.

### PR #4 · Diseño de marca (`feat/diseno-marca`)

**Objetivo:** reemplazar el diseño provisorio del PR #3 por el sistema de marca de Home Bakery.

**Prompt resumido:** partir de `main` y leer la doc de Next 16 en `node_modules`. Tokens de color en `globals.css` (Tailwind v4, `@theme`), cuatro tipografías con `next/font/google`, barra de avisos, header sticky con el logo en un círculo taupe, menú mobile accesible, footer en chocolate y botón flotante de WhatsApp. Componentes base (`Button`, `Eyebrow`, `SectionTitle` e imagen con placeholder) y todos los textos en `data/site.ts`. Renombrar `/productos` a `/tienda` y `/nosotros` a `/maggie`, y eliminar `/contacto`. Mobile-first, HTML semántico, foco visible y contraste AA.

**Ajustes al plan:**

- El botón de WhatsApp va en verde WhatsApp (`#25D366`) con texto e ícono en `#0B3B1E`, que da contraste AA, y con `ring-2 ring-hueso` para que se distinga sobre el footer. El primer plan lo dejaba en chocolate y hubo que pedirlo dos veces.
- El logo va dentro del círculo taupe solo en el header. En el footer va el logo blanco solo.
- Antes de seguir, descartar los cambios sin commitear de `app/globals.css` y `data/site.ts` (ver [errores.md](errores.md#archivos-revertidos-entre-vs-code-y-claude-code)).

**Ajuste después de abrir el PR:** se agregó el mockup aprobado en `docs/mockup/` y se pidió comparar la barra de avisos, el header, el menú mobile, el footer, el botón de WhatsApp, los tokens y las tipografías con `inicio-desktop.html` e `inicio-mobile.html`, y ajustar todo lo que difiriera. El mockup va en su propio commit.

**Resultado:** tokens y tipografías de marca, layout completo, componentes base, datos y textos en `data/site.ts`, y redirecciones 308 desde las rutas viejas porque el sitio ya estaba publicado. Mergeado el 29/09.

### PR #5 · Fidelidad al mockup (`feat/fidelidad-mockup`)

**Objetivo:** que el inicio, la tienda, el header, el footer y el botón de WhatsApp queden iguales al mockup aprobado, a 1440 y 390 px.

**Prompt resumido:** crear `scripts/compare-mockup.ts` con Playwright para capturar el mockup y el sitio en los dos anchos y guardarlos lado a lado (`npm run compare`). Replicar el inicio y la tienda con los mismos tamaños, espaciados, radios, sombras y colores, agregando como token cualquier valor exacto que falte. Mover productos y workshops a `data/products.ts` y `data/workshops.ts`, con tipos pensados para Supabase y acceso por `lib/data.ts`. Repetir la comparación hasta que no queden diferencias visibles. Solo se permiten excepciones por accesibilidad o responsive, y cada una va documentada en el PR.

**Ajustes al plan:**

- No seguir en el PR #4: Catalina lo mergeó y la rama nueva salió de `main`, con el commit del mockup pendiente primero.
- Un solo footer, el completo, en todas las páginas. El footer compacto de `tienda.html` fue una simplificación del mockup, no una decisión de diseño. (En la pregunta del plan se había elegido "como el mockup"; se corrigió al revisarlo.)
- Mismo orden de secciones en mobile y desktop, sin `order-*`, para que el orden visual coincida con el del DOM (WCAG 1.3.2 y 2.4.3).
- Sin carrito en este PR: "Agregar al pedido" queda deshabilitado con el texto "Muy pronto" y el carrito llega en su propio PR con Supabase. (En la pregunta del plan se había elegido "carrito mínimo"; se corrigió al revisarlo.)

**Ajustes antes de mergear:**

- Sacar el hueco antes de "Retiros", que había quedado de un borrado.
- No mostrar precios inventados: `price` en `null` con su `TODO`, y "Precio a confirmar" en la tarjeta y la ficha.
- Bordes de chips, select e inputs con contraste 3:1 (WCAG 1.4.11): token `borde-control` con el color más cercano a `#D9C8BD` que cumple, documentado como excepción.

**Resultado:** comparador visual, tokens sin valores arbitrarios, datos en `data/`, inicio y tienda como el mockup, y ocho excepciones documentadas en el PR. Mergeado el 29/09.

### PR #6 · Workshops, Maggie, 404 y Lighthouse (`feat/workshops-maggie`)

**Objetivo:** rehacer `/workshops` y `/maggie` según el mockup, sumar una página 404 y medir Lighthouse.

**Prompt resumido:** replicar `workshops.html` y `maggie.html` usando el ciclo de comparación, con los datos de `lib/data.ts` y los textos de `data/site.ts`. Los botones "Reservar" llevan a `/workshops/[slug]/inscripcion`, que todavía no existe. Crear `app/not-found.tsx` en español con el estilo de la marca. Correr Lighthouse (Accessibility, Best Practices y SEO) en mobile sobre las cuatro páginas públicas, corregir lo que baje de 90 y guardar los puntajes en `docs/lighthouse.md`.

**Respuestas a las preguntas del plan:** los textos entre corchetes del mockup van como texto provisorio con `TODO`, y los precios de los workshops quedan como "Precio a confirmar".

**Ajustes antes de mergear:** no publicar nada inventado sobre Maggie ni compromisos con clientas. El detalle está en [Decisión: no publicar datos inventados](#decisión-no-publicar-datos-inventados). Además, sumar al principio de `AGENTS.md` la regla de responder en español (Argentina) y no inventar datos del negocio.

**Resultado:** `/workshops` y `/maggie` como el mockup, 404 en español dentro del layout y Lighthouse en 100 en las tres categorías y las cuatro rutas, sin correcciones. Mergeado el 29/09.

### PR #7 · Inscripción a workshops (`feat/inscripcion-workshop`)

**Objetivo:** que "Reservar mi lugar" lleve a un formulario de inscripción real, a partir de `docs/mockup/inscripcion-workshop.html`.

**Prompt resumido:** formulario como client component (nombre, WhatsApp, email, experiencia, alergias, cómo nos conoció y aceptación de la política de cancelación) con selector de lugares limitado por el cupo y total en vivo. Un solo esquema zod en `lib/validation/inscripcion.ts` para el cliente y el servidor, con errores por campo en castellano, `aria-invalid`, `aria-describedby` y foco en el primer campo inválido. `POST /api/inscripciones` que revalida y controla el cupo (201, 400, 409 y 500) y guarda en memoria con un `TODO` para Supabase en E5. Estados de envío, error con reintento y éxito (paso "Pago" con Mercado Pago deshabilitado hasta E6). Sumar la pantalla al comparador y un test e2e con Playwright.

**Ajuste al plan:** como el guardado en memoria no persiste en Vercel, el paso de éxito pide mandarle a Maggie un mensaje de WhatsApp ya armado. El detalle está en [errores.md](errores.md#el-guardado-en-memoria-no-persiste-en-vercel).

**Correcciones de Claude Code durante el desarrollo** (no fueron pedidas, salieron de su propia verificación):

- Calcular el cupo sobre los datos originales del workshop.
- Mostrar la fecha del mensaje de WhatsApp en formato de 24 h.
- Descontar los lugares reservados en el resumen después de inscribirse.
- Correr los e2e con movimiento reducido.

**Resultado:** inscripción completa con validación compartida, API con control de cupo, paso de pago por WhatsApp y tests e2e. Los textos del mockup que comprometen al negocio quedaron afuera, como `TODO`. Abierto el 29/09 y mergeado el 30/09.

### Decisión: no publicar datos inventados

El sitio es público y el negocio es real, así que un precio, una política o una frase inventada puede tomarse como un compromiso con las clientas. La regla quedó en `AGENTS.md`: no inventar precios, políticas, fechas ni textos en primera persona de Maggie, y usar placeholders o `TODO`.

Cómo se aplicó en cada PR:

- **PR #5:** los precios de los productos quedan en `null` y la tienda muestra "Precio a confirmar".
- **PR #6:**
  - La política de cancelación se reemplazó por "Escribinos por WhatsApp y te contamos la política de cancelación de cada workshop", con link a WhatsApp.
  - Se sacaron las preguntas frecuentes que no se podían responder con datos confirmados.
  - La presentación y los valores de `/maggie` usan solo la bio de Instagram de Maggie, sin frases nuevas en su voz.
  - La línea de tiempo muestra las etapas sin años, salvo la web (2026).
  - "Incluye" dice "A confirmar" en cada workshop.
- **PR #7:** no se publican el hint del email ni la nota de confirmación del pago del mockup, porque comprometen al negocio. El link a la política de cancelación va a la FAQ de `/workshops` hasta que exista la política.
- **PR #10:**
  - Los textos de Maggie van textuales, de `docs/contenido-maggie.md`. Donde el mockup v6 los parafraseaba, se usaron oraciones completas suyas.
  - El carrusel queda con placeholders de color hasta que Maggie mande fotos horizontales.
  - "Así fueron los workshops" muestra solo el título y el link a Instagram, sin nombres inventados.
  - El saldo de la seña dice "a confirmar con Maggie".
  - Se borraron la bio provisoria de `site.owner.bio` y los valores de `/maggie`, que ya no se usaban y no eran de Maggie.
- **PR #11:**
  - El catálogo se carga tal cual de `catalogo.json`, con los precios en `null` ("Precio a confirmar").
  - Los workshops de `data/workshops.ts` se marcan como de ejemplo (`es_ejemplo`): se ven con aviso y no aceptan inscripciones.
  - "Los favoritos de la casa" se oculta hasta que Maggie elija los destacados.
  - En el detalle de los productos a medida se sacó una frase que prometía un presupuesto.

Lo que falta completar con Maggie está marcado con `TODO` en `data/site.ts`, `data/products.ts` y `data/workshops.ts`.

## 04/10/2026

Maggie revisó el sitio el 01/10 y mandó textos y cambios por WhatsApp. Catalina pasó el contenido a `docs/contenido-maggie.md` y actualizó el mockup a la v6 (`docs/mockup/README.md`, "Cambios de la v6").

### Pedidos de Maggie (01/10)

- **Logo:** solo "home bakery", sin "cakes & pastries", porque con la bajada queda todo más chiquito.
- **Portada del inicio:** foto bien horizontal y a todo el ancho, no a la derecha con bordes redondeados. Si puede ser video, mejor. Idealmente un carrusel de 3 o 4 fotos o videos. Textos nuevos: "Artesanal, delicado y casero" / "Pastelería y workshops" / "Workshops reducidos en mi cocina y pastelería por encargo…".
- **Presentación:** su foto real y su historia en primera persona.
- **Workshops:** mostrar primero qué son, con un video de fondo que muestre la dinámica de cocina (tiene reels). Darle menos protagonismo al workshop del mes y ponerlo abajo, tipo agenda. Mandó las respuestas de las preguntas frecuentes.
- **Reglas que salen de sus textos:**
  - Hasta 8 personas, con un mínimo de 4.
  - 2 h aprox.
  - Reserva con seña del 50%.
  - Sin reembolso, pero se puede pasar el lugar a otra persona.
- **Pendiente de Maggie:**
  - Fotos o videos horizontales para el carrusel.
  - Reels de los workshops.
  - Nombre, mes/año y foto de 4 workshops pasados.
  - Cuándo y cómo se paga el saldo.

### PR #10 · Contenido de Maggie v6 (`feat/contenido-maggie-v6`)

**Objetivo:** llevar al sitio los textos y cambios de Maggie, fiel al mockup v6.

**Prompt:**

> Creá la rama feat/contenido-maggie-v6 desde main. Los cambios sin commitear en docs/, public/brand/ y public/fotos/ son parte de este PR; supabase/ NO (es del próximo).
> Contexto: Maggie revisó el sitio y mandó textos y cambios. Ya actualicé el mockup a la v6. Antes de planificar, leé docs/mockup/README.md (sección "Cambios de la v6") y docs/contenido-maggie.md. Los textos de Maggie van tal cual: no inventes ni reescribas nada.
> Implementá, mobile-first y fiel al mockup (inicio-desktop, inicio-mobile, workshops, maggie, inscripcion-workshop):
> 1. Logo: homebakery_logo_sin_tagline_white.png en el header (círculo taupe) y en el footer; homebakery_logo_sin_tagline.png donde vaya en negro.
> 2. Portada del inicio: componente cliente HeroCarousel a todo el ancho (720 px desktop / 640 px mobile), con la capa oscura y los textos de Maggie. Cada diapositiva puede ser foto o video ({ type, src, poster?, alt }, datos en data/site.ts). Accesibilidad: anterior/siguiente, puntos con 44 px de área táctil y botón de pausa visible. Avanza solo cada ~6 s, se frena con hover o foco y no avanza solo con prefers-reduced-motion. aria-roledescription, y aria-live "off" mientras avanza solo. Videos muted loop playsInline con póster. Sin librerías de carrusel. La primera imagen se precarga (LCP). Mientras Maggie no mande material, elegí 3 fotos de producto en buena resolución de "…/CATALOGO/_para-la-web/fotos" (ver catalogo.json, baja_resolucion: false) que funcionen recortadas en horizontal. Copialas a public/fotos/portada/ y marcalas TODO(Maggie) como provisorias.
> 3. Presentación en el inicio con public/fotos/maggie-presentacion.jpg (next/image) y los textos del mockup.
> 4. La banda "Workshop del mes" del inicio pasa a ser "Grupos reducidos en mi cocina"; la próxima fecha sale de getFeaturedWorkshop().
> 5. /workshops en el orden del mockup: portada con video de fondo (placeholder hasta tener los reels, con botón de pausa), Cómo enseño, Cómo es un workshop (4 pasos + datos), Agenda (próximas fechas con cupo; el destacado es una fila más), Así fueron (sin nombres inventados: si no hay datos, solo el título y el link a Instagram), workshop personalizado y FAQ con las 6 respuestas reales en \<details\>.
> 6. /maggie: hero con la foto real, "Mi historia" en tres partes con el texto completo; sacá la línea de tiempo con años.
> 7. Inscripción: el resumen muestra total, "Seña para reservar (50%)" y saldo; el botón dice "Pagar la seña" (sigue siendo el paso por WhatsApp hasta el E6). El texto del saldo queda como TODO(Maggie). Cupo máximo 8. El mensaje prefijado de WhatsApp menciona la seña.
> 8. data/workshops.ts: cupo 8 y duración 120 min. Todos los textos nuevos en data/site.ts.
> Calidad: solo tokens de globals.css, foco visible, contraste AA del texto sobre la capa oscura (probalo con una foto clara). Lighthouse ≥95 en accesibilidad y SEO en /, /workshops y /maggie (actualizá docs/lighthouse.md). Corré npm run compare y guardá capturas en docs/mockup/capturas-pr/. Actualizá el e2e de inscripción y sumá uno del carrusel (pausa y navegación con teclado). Registrá en docs/bitacora-ia.md los pedidos de Maggie y este prompt.
> Commits chicos; lint, build y e2e en verde; PR con el template. No mergees.

**Respuestas a las preguntas del plan:**

- **Fotos del carrusel:** las 56 fotos en buena resolución del catálogo son todas verticales (1200×1600 o 901×1600). Quedan placeholders de color hasta que Maggie mande material, y no se creó `public/fotos/portada/`.
- **Textos:** el mockup v6 parafraseaba algunos textos de Maggie, por ejemplo "Me formé como chef profesional en el IAG…", los 4 pasos del workshop y "PDF:" con dos puntos, y sumaba frases que no son de ella. Se usaron sus oraciones textuales; los títulos y etiquetas del mockup quedaron. Las frases inventadas pasaron a `TODO(Maggie)`, por ejemplo "Si el cupo se completa antes, no se cobra nada".
- **Contraste:** se mantuvo la capa del mockup y se sumó un degradé debajo del texto, medido sobre blanco puro (ver [lighthouse.md](lighthouse.md#contraste-del-texto-sobre-las-portadas)).

**Correcciones de Claude Code durante el desarrollo** (no fueron pedidas, salieron de su propia verificación):

- Reforzar el degradé de la portada porque el eyebrow de desktop daba 3.77:1 sobre blanco.
- Dejar margen debajo de los títulos con palabra manuscrita, para que el trazo bajo no pise la bajada.
- El botón de pausa del video de fondo aparece recién cuando hay video: un botón que no controla nada confunde a los lectores de pantalla.
- Los botones "Reservar" de la agenda ocupaban todo el ancho en mobile.
- La seña ("A confirmar") se cortaba en dos líneas en mobile.
- Se borraron funciones y datos que quedaron sin uso (`getNextWorkshop`, `formatDuration`, `FeaturedWorkshop`, `Hero`).

**Resultado:**

- Logo sin tagline.
- Carrusel accesible sin librerías.
- Presentación con la foto de Maggie.
- Banda y página de workshops reorganizadas.
- `/maggie` con su historia completa.
- Inscripción con seña del 50% y cupo de 8.
- e2e nuevos del carrusel.
- Lighthouse en 100.

Abierto el 04/10, sin mergear.

## 05/10/2026

### PR #11 · E4: catálogo y workshops en Supabase (`feat/e4-supabase-catalogo`)

**Objetivo:** que el catálogo y los workshops se lean de Supabase, con API interna en Route Handlers e inscripciones persistidas sin sobreventa.

**Prompt resumido:**
1. Migración SQL con categorías, productos, tamaños, imágenes, workshops, imágenes de workshops e inscripciones: checks, triggers de `updated_at` e índices.
2. RLS en todas las tablas, con lectura pública solo de lo activo. Inscripciones solo por la función `crear_inscripcion` (security definer, `for update`), sin select ni insert públicos. Vista `workshops_publicos` con lugares libres.
3. Buckets públicos de Storage.
4. Clientes de Supabase con las claves publishable y secret, y `.env.example`.
5. `npm run seed` idempotente que sube las fotos.
6. `lib/data.ts` contra Supabase, con filtro `?categoria=` y detalle `/tienda/[slug]`, y revalidación cada 5 minutos.
7. API `{ data }` / `{ error }` con zod y headers de caché.
8. Tests de la API y e2e de la tienda y la inscripción, sin ensuciar los datos reales.
9. `docs/modelo-de-datos.md`.

Nunca escribir claves en el código, los commits ni los logs.

**Respuestas a las preguntas del plan:**

- **Caché de `/tienda`:** leer `searchParams` en el servidor vuelve dinámica la página. Se eligió ISR con el filtro en el cliente: el componente que usa `useSearchParams` va en un `<Suspense>` con el catálogo completo de fallback. Los chips llevan `aria-pressed`, hay un estado vacío y el título dice la categoría.
- **Favoritos del inicio:** ningún producto viene destacado, así que la sección se oculta hasta que Maggie elija.

**Ajustes al plan:**

- El proyecto tiene desactivado "Automatically expose new tables". La migración da permisos explícitos a `service_role` (tablas, funciones y los mismos por defecto) y el seed lo verifica.
- Los workshops de `data/workshops.ts` son de ejemplo:
  - Columna `es_ejemplo`.
  - Aviso visible "Fecha de ejemplo: todavía no hay inscripción abierta", sin botón Reservar.
  - `crear_inscripcion` los rechaza.
- `docs/modelo-de-datos.md` explica como decisión consciente que `crear_inscripcion` se puede ejecutar con la clave publishable: el riesgo y lo pendiente para el E5 (rate limit o captcha, y cancelación desde el panel).

**Supuestos de Claude Code explicados en el PR:**

- **Cliente sin cookies:** `lib/supabase/server.ts` usa `createClient` sin cookies en lugar de `createServerClient` de `@supabase/ssr`. Leer cookies vuelve dinámica cada página y anula el ISR. El cliente con cookies entra en el E5 con el login de la admin.
- **`presentacion`:** se carga desde `unidades` del catálogo.

**Correcciones de Claude Code durante el desarrollo** (no fueron pedidas, salieron de su propia verificación):

- Probar la migración en un Postgres local (PGlite) antes de pasarla. Así apareció, por ejemplo, que un workshop con cupo 3 necesita `cupo_minimo` ≤ 3.
- La vista con `security_invoker` no podía sumar los lugares ocupados, porque anon no lee inscripciones. Se agregó `lugares_ocupados()` como security definer, que devuelve solo el total.
- Reintentos en la subida de fotos del seed: una corrida falló una vez por un error de red transitorio.
- La API no registra el `detail` de los errores de Postgres, porque un check fallido incluye la fila con datos personales.
- Arreglar la primera línea de `docs/lighthouse.md`, que había quedado cortada en el PR #10.

**Resultado:**

- 77 productos (7 ocultos), 7 categorías, 198 fotos y 3 workshops de ejemplo en Supabase.
- RLS verificada con la clave publishable.
- API con 5 rutas.
- 36 tests en verde, incluido uno de concurrencia: diez inscripciones simultáneas con cupo 3 dejan una sola reserva.
- Lighthouse en 100.

Abierto el 05/10, sin mergear.

## 21/10/2026

### PR #12 · E5: auth, roles y API de admin (`feat/e5-auth-admin-api`)

**Objetivo:** la base del panel de Maggie. Login con Supabase Auth, roles (RBAC), protección en capas, API REST versionada con la API de admin y revalidación on-demand. El panel visual va en el próximo PR.

**Prompt resumido** (pedía seguir las clases de Auth y de APIs y leer antes la doc de Next 16 y la de `@supabase/ssr`; mostrar el plan y el SQL antes de escribir código):
1. Migración `0002_auth_admin.sql`:
   - Tabla `perfiles` (admin/editor) con RLS.
   - `es_admin()` security definer.
   - Políticas de admin en las tablas del catálogo y los workshops (lectura completa y escritura).
   - En `inscripciones`, select y update del estado, sin delete.
   - Storage solo para la admin, GRANTs explícitos y el SQL para asignar el rol.
2. `lib/supabase/server-auth.ts` con `createServerClient` y cookies HttpOnly, Secure y SameSite=Lax, sin tocar el cliente público (ISR).
3. `proxy.ts` solo para `/admin` y `/api/v1/admin`: renueva la sesión; sin sesión, login o 401 JSON. Volver a verificar con `getClaims()` + `es_admin` en el layout, los handlers y las acciones: sin rol, 403.
4. Login según el mockup:
   - Server Action con zod y error genérico.
   - Estado de carga, autocomplete y foco al error.
   - Recuperación, contraseña nueva y cerrar sesión.
   - Rate limit de Supabase documentado más 5 intentos cada 15 minutos por IP en memoria (TODO Redis).
5. API pública en `/api/v1` con 308 desde las rutas viejas. API de admin: productos (con imágenes de hasta 5 MB en Storage), workshops (409 si tienen inscripciones), inscripciones por workshop y cambio de estado.
6. Capa de servicio `lib/admin/*` con esquemas zod compartidos (trim, sin HTML, slugs únicos) y wrapper `withApi`: 400 con `fields`, 401, 403, 404, 409 y 500 genérico sin stack trace ni datos personales.
7. Revalidación on-demand de `/`, `/tienda`, `/tienda/[slug]` y `/workshops`, en lugar de los `TODO(E5)`.
8. e2e contra Supabase con una admin y una usuaria sin rol creadas con la secret key, todo limpio al final.
9. `docs/modelo-de-datos.md` con los permisos por rol, `docs/seguridad.md`, README y bitácora. Checklist del E5 en el PR.

Nunca escribir claves ni contraseñas en el código, los commits ni los logs. Commits chicos y lint, build y tests en verde. No mergear.

**Respuestas a las preguntas del plan:**

- **403 de la página:** `forbidden()` de Next con `experimental.authInterrupts`. Devuelve un 403 HTTP real y agrega `noindex`, a cambio de usar un flag experimental.
- **Link de recuperación:** con `token_hash` y la plantilla propia, para que funcione en cualquier navegador. Esto cambió después (ver abajo).
- **Checklist del E5:** lo pasó Catalina. Está en el PR, marcado con lo que cubre este PR y lo que queda para el del panel.

**Cambio pedido durante el desarrollo:** en este proyecto las plantillas de mail no se pueden editar sin SMTP propio. Catalina pidió:
- que `/admin/auth/confirm` acepte también `?code=` (PKCE, la plantilla por defecto);
- que muestre un mensaje claro si el link venció o se abrió en otro navegador;
- documentar los límites del SMTP por defecto, la plantilla en español para cuando haya SMTP (Resend) y el reseteo manual desde el dashboard, como `TODO(SMTP)`.

**Ajustes al plan:**

- **Layout del sitio en `app/(sitio)`:** el layout raíz traía el header y el footer públicos, que el panel no tiene que heredar. Las URLs no cambiaron.
- **Dos funciones SQL que no estaban pedidas:**
  - `cambiar_estado_inscripcion` bloquea la inscripción y el workshop, así reactivar una cancelada no sobrevende (409).
  - `reemplazar_tamanos` cambia los tamaños en una sola transacción.
- **Foto individual en su propia ruta:** el PATCH y el DELETE van en `productos/[id]/imagenes/[imagenId]`, porque sobre la colección no tienen a qué foto apuntar.
- **Chequeo de `Origin`** en las escrituras de la API de admin, como segunda barrera contra CSRF además de SameSite=Lax.
- **Revalidación también en `POST /api/v1/inscripciones`:** una inscripción nueva cambia los lugares libres de `/` y `/workshops`.

**Supuestos de Claude Code explicados en el PR:**

- **Campos de la API de admin** en inglés camelCase (`name`, `categoryId`, `sizes`), igual que la API pública.
- **El slug no cambia** al editar el nombre: los links publicados siguen andando.
- **Se cuentan solo los intentos fallidos** para el rate limit del login, y uno correcto borra el contador.
- **Inicio del panel provisorio:** `/admin` muestra un aviso con "Cerrar sesión" hasta el próximo PR.

**Correcciones de Claude Code durante el desarrollo** (no fueron pedidas, salieron de su propia verificación):

- **Migración probada en PGlite** antes de pasarla, con 47 chequeos de RLS para anon, sin rol, editor, admin y service_role. Entre ellos, que la admin no puede editar el nombre de una inscripción ni cambiarse el rol.
- **Cerrar sesión con `scope: "local"`:** el default cerraba todas las sesiones de la usuaria, en todos los dispositivos.
- **Trace apagado en los tests que escriben contraseñas reales:** Playwright guarda en el trace lo que se escribe en los inputs. El teardown borra las sesiones guardadas en `e2e/.auth/`.
- **Tests del E4 que fallaban por fecha:** tres tests fijaban un workshop de ejemplo cuya fecha ya pasó. Ahora buscan el próximo (ver [errores.md](errores.md#tests-atados-a-una-fecha-de-ejemplo-que-ya-pasó)).
- **Lighthouse y axe en las pantallas nuevas:** el logo se veía borroso en desktop, y el panel del logo pasó a `<header>`.

**Resultado:**

- 56 tests en verde contra Supabase, entre ellos:
  - redirección sin sesión, login genérico y foco;
  - 403 sin rol y 401/403 en la API;
  - CRUD de productos que aparece y desaparece de la API pública;
  - fotos validadas por contenido;
  - estados de inscripción con cupo;
  - 409 al borrar un workshop con inscripciones;
  - `Origin`, 308 y rate limit.
- Al final de la corrida quedaron 0 usuarias, productos, workshops, inscripciones y fotos de prueba.
- Las páginas públicas siguen estáticas con ISR (build).
- Lighthouse en las pantallas de acceso: 100 en Accessibility y en Best Practices. axe-core: 0 violaciones en la 403.

Abierto el 21/10, sin mergear.

### PR #13 · E6: seña de los workshops con Mercado Pago (`feat/e6-mercadopago-sena`)

**Objetivo:** cobrar la seña de los workshops con Mercado Pago Checkout Pro, con webhook firmado, conciliación y pruebas exhaustivas. Los pedidos de la tienda quedan como TODO hasta que haya carrito.

**Prompt resumido** (pedía leer antes la doc actual de MP y usar el SDK oficial `mercadopago`; mostrar el plan y el SQL antes de escribir código):
1. **Migración `0003_pagos.sql`:**
   - tabla `pagos` (lectura solo `es_admin()`);
   - `monto_sena` (calculada en `crear_inscripcion`) y `vence_at` (+30 minutos) en las inscripciones;
   - `lugares_ocupados` sin las pendientes vencidas;
   - HB422 sin precio;
   - `confirmar_pago` (security definer, solo `service_role`, idempotente, reserva si el monto coincide y hay cupo; si no, devolución manual).
2. **`lib/mercadopago.ts`** server-only, con la URL base desde `NEXT_PUBLIC_SITE_URL`, `VERCEL_URL` o localhost.
3. **`POST /api/v1/inscripciones`** crea la inscripción y la preferencia (ítem, seña, `external_reference`, `back_urls`, `auto_return`, `notification_url`, 30 minutos, `HOMEBAKERY`) y responde `{ id, initPoint }`. El formulario reemplaza WhatsApp por "Pagar la seña con Mercado Pago".
4. **Webhook** con validación de `x-signature` (HMAC SHA256, tiempo constante, tolerancia de `ts`). Consulta el pago real, llama a `confirmar_pago`, es idempotente y revalida.
5. **Conciliación** desde la página de resultado con la misma función que el webhook, porque los previews de Vercel están protegidos y el webhook no les llega.
6. **Página de resultado** con el estado real de la base: aprobado (seña, `.ics`, WhatsApp), pendiente (se refresca hasta 1 minuto) y rechazado (reintentar). Con `aria-live` y foco en el título.
7. **Panel:** lista simple de inscripciones con su pago y las marcadas para devolver.
8. **Seguridad:** secretos solo en el servidor, el monto desde la base y rate limit de 5 inscripciones por IP cada 10 minutos (`TODO(Redis)`).
9. **Tests exhaustivos:** unitarios (firma, seña), webhook y conciliación con MP mockeado, expiración, concurrencia, 422 y e2e hasta el `initPoint`. Más `docs/pruebas-mercadopago.md` para la prueba manual en sandbox.
10. **Docs:** `docs/pagos.md` con el diagrama de secuencia, variables nuevas, bitácora y el checklist del E6.

**Respuestas a las preguntas del plan:**

- **Mock de MP en los tests:** un servidor mock local. El SDK tiene la URL base fija, así que `lib/mercadopago.ts` la reemplaza solo si `MP_API_BASE_URL` apunta a localhost. Los e2e no usan credenciales reales; el sandbox real queda para la prueba manual.
- **Webhook:** procesa y después responde 200. Si MP o la base fallan, responde 500 y MP reintenta.
- **Pago aprobado tarde y sin cupo:** la inscripción pasa a `cancelada` y el pago queda con `devolucion_pendiente`.

**Cambio pedido durante el desarrollo:** al aprobar el plan, Catalina había pedido que `crear_inscripcion` dejara de tener `grant` para anon y authenticated. El pedido no estaba en el contexto de Claude Code y se aplicó cuando lo recordó:
- migración `0004_inscripcion_solo_servidor.sql` (solo `service_role`);
- la API la llama con el cliente admin;
- un e2e prueba que la clave publishable recibe `42501`;
- en seguridad y en el modelo de datos, el riesgo aceptado del E4 queda cerrado.

**Ajustes al plan:**

- **Sin efectivo ni cajero en la preferencia:** se acreditan en días, cuando la reserva de 30 minutos ya venció.
- **`auto_return` y `notification_url` solo con https:** MP no los acepta en localhost.
- **La tolerancia de `ts` se controla aparte del validador del SDK:** la doc de MP habla de segundos y de milisegundos, así que se aceptan los dos. El HMAC sigue siendo el del SDK.
- **Reintentos del SDK limitados a 1, con 8 s de timeout:** con los valores por defecto, el webhook podía pasar los 22 s que espera MP.
- **Si MP falla al crear la preferencia,** la inscripción se cancela para liberar el cupo y la API responde 502.
- **`SUPABASE_SECRET_KEY` pasa a necesitarse en el servidor (Vercel):** solo `service_role` puede ejecutar `confirmar_pago` y, desde la 0004, `crear_inscripcion`.
- **Sin la constante fija del 50%:** la seña usa el porcentaje de cada workshop (`sena_porcentaje`, 50% por defecto), y `formatPrice` muestra centavos cuando los hay.

**Correcciones de Claude Code durante el desarrollo** (no fueron pedidas, salieron de su propia verificación):

- **Migraciones en PGlite:** se probaron 0003 y 0004 antes de pasarlas, con 33 chequeos (permisos, HB422, vencimiento, idempotencia, monto y moneda distintos, último lugar, devoluciones).
- **La página de resultado mostraba "pendiente" con el pago ya registrado:** era la memoización de `fetch` de Next más `revalidatePath` durante el render. Se reprodujo a mano y se corrigió con un `AbortSignal` y `after()` (ver [errores.md](errores.md#la-página-de-resultado-mostraba-pendiente-con-el-pago-ya-registrado)).
- **Escape del `;` en el `.ics`:** lo encontró el test unitario.
- **Botón de pago después de "atrás":** se resetea con `pageshow`, porque el navegador restaura la página desde el bfcache con "Te llevamos a Mercado Pago…".
- **Fecha de la reserva** con el formato del sitio, en lugar de "08:17 p. m..".

**Resultado:**

- **97 tests en verde** contra Supabase y el mock de MP:
  - 21 unitarios;
  - 20 de pagos: webhook, firma, idempotencia, concurrencia, vencimiento, 422, 502, la clave publishable, el resultado y el panel;
  - el resto, del E4 y el E5.
- Al final de la corrida quedaron 0 usuarias, workshops, inscripciones y pagos de prueba.
- Las páginas públicas siguen estáticas con ISR.
- **Lighthouse** de la página de resultado: 100 en Accessibility y 100 en Best Practices. **axe:** 0 violaciones en el paso de la seña.
- **Sin probar todavía con el sandbox real de MP:** faltan las credenciales de prueba. El paso a paso está en `docs/pruebas-mercadopago.md`.

Abierto el 21/10, sin mergear.

## 22/10/2026

### PR #15 · E5: panel de Maggie (`feat/e5-panel-admin`)

**Objetivo:** el panel visual para que Maggie maneje la tienda, los workshops y las inscripciones, fiel a `docs/mockup/admin-*.html` en desktop y mobile. Usa la capa `lib/admin/*` y Server Actions con los mismos esquemas zod.

**Prompt resumido** (pedía leer antes el README del mockup, los mockups del panel y lo que ya había en `app/admin`, y mostrar el plan):
1. **Layout:**
   - barra lateral en desktop y menú en mobile, con Productos, Workshops e Inscripciones;
   - "Pedidos" deshabilitado ("Llega con el carrito"), nombre de la usuaria y Cerrar sesión, y `noindex`;
   - el inicio resume los próximos workshops, los pendientes de seña y "Para devolver".
2. **Productos:** buscador y filtros, precio en línea por tamaño (Enter o al salir, con `aria-live`), Pausar/Mostrar con Deshacer de 5 s, estrella de destacado (hasta 4) y "Nuevo producto".
3. **Editor de producto:** textos, tamaños y precios, fotos (vista previa, webp de 1600 px con sharp, portada, ↑↓, alt obligatorio, borrar con confirmación), visibilidad, anticipación, temporada, sabores y decoraciones, "Ver en la tienda" y borrar con un diálogo que sugiere pausar.
4. **Workshops:** próximos y pasados, crear y editar (hora de Buenos Aires, cupo de hasta 8, mínimo, fotos, activo, destacado, es_ejemplo) y un aviso si no llega al mínimo de 4.
5. **Inscripciones:** filtros, estado editable con `cambiar_estado_inscripcion`, pago, WhatsApp de cada persona y "Marcar como devuelto".
6. **UX:** feedback en cada acción, validación en el cliente y en el servidor con foco al primer error, aviso al salir con cambios, estados vacíos, teclado, 390 px, 44 px y AA.
7. **Revalidación:** cada guardado revalida las páginas públicas.
8. **e2e:** precio en línea, pausar, producto con foto, workshop con una inscripta y devolución. Con limpieza, Lighthouse de 95 o más y capturas.
9. **Docs:** bitácora y `docs/guia-panel.md` para Maggie.

**Respuestas a las preguntas del plan:**

- **Textos en `data/admin.ts`**, la convención del E5 para el panel, y no en `data/site.ts`.
- **Fotos:** el navegador las achica a 2400 px antes de subirlas, porque Vercel corta los pedidos de más de 4,5 MB, y sharp las pasa a webp de 1600 px en el servidor.
- **"Marcar como devuelto"** con la migración 0005: `marcar_devuelto` solo para la admin, que guarda cuándo y quién.
- **Workshops** como el mockup: lista y detalle con las pestañas Inscriptas y Datos, más `/admin/inscripciones` global.

**Ajustes al plan:**

- **`confirmar_pago` recreado en la 0005** con un solo cambio: un aviso repetido de MP no vuelve a marcar "para devolver" un pago ya devuelto. Sin esto, el webhook deshacía lo que marcaba Maggie.
- **Las fotos de los workshops se ven en la web pública:** `lib/data.ts` las lee y queda resuelto el `TODO(Maggie)` de `toWorkshop`.
- **Lugares ocupados en el panel** con la misma regla que la base desde la 0003: no cuentan las pendientes vencidas. El aviso de mínimo usa las reservadas.
- **Mensajes de zod en español** como respaldo (`z.config(z.locales.es())`), y mensajes propios en los campos del panel que no tenían.
- **Lo que trae el mockup y queda afuera:** "Ajustes", "Escribir a todas", "Descargar lista", "Política de cancelación" (no existe en la base; `TODO(Maggie)`) y arrastrar fotos (se ordenan con ↑↓). El botón flotante de "Nuevo producto" en mobile se reemplazó por el botón del encabezado.

**Correcciones de Claude Code durante el desarrollo** (no fueron pedidas, salieron de su propia verificación):

- **Migración 0005 en PGlite:** se probó antes de pasarla, con 40 chequeos entre los de antes y los nuevos de devoluciones.
- **El foco de los diálogos caía en "Borrar definitivamente":** `autoFocus` de React no funciona con `showModal()`. Se corrigió con `data-autofocus` (ver [errores.md](errores.md#los-diálogos-enfocaban-borrar-definitivamente)).
- **"Subir" era ambiguo:** en el editor también existía "Subir tamaño 1", así que el botón pasó a "Subir la foto".
- **Logo de la barra mobile:** Lighthouse marcaba `image-aspect-ratio` y pasó a un `<img>` con sus medidas reales.
- **Nada en el render:** el linter no deja actualizar estado dentro de efectos ni llamar a `Date.now()` mientras se renderiza. El resultado del guardado se procesa en la acción de `useActionState` y el "vencida" se calcula en el servidor.

**Resultado:**

- **112 tests en verde** contra Supabase y el mock de MP:
  - 7 del panel;
  - 6 unitarios nuevos (fecha de Buenos Aires, número de WhatsApp, precios en formato argentino);
  - el resto, del E4, el E5 y el E6, ajustados al panel.
- Al final de la corrida quedaron 0 usuarias, productos, workshops y fotos de prueba. Quedan las 6 inscripciones de las pruebas manuales en sandbox del 21/10.
- **Lighthouse:** 100 en Accessibility y 100 en Best Practices en las siete pantallas del panel, mobile y desktop.
- **Error del servidor que no hace fallar los tests:** en la corrida aparece varias veces "The destination stream closed early". Coincide con tests que terminan o navegan mientras una respuesta todavía se está mandando.

Abierto el 22/10, sin mergear.

## 27/10/2026

### PR #17 · Contenido de Maggie 2 (`feat/contenido-maggie-2`)

**Pedido:** tres cambios de contenido de Maggie:
1. pago completo al inscribirse, sin seña;
2. la lista de los 9 workshops de 2026 en "Así fueron los workshops";
3. el reel de los workshops como video del hero de `/workshops`.

**Decisiones de Catalina durante el plan:**

- La respuesta de la FAQ "¿Cómo reservo mi lugar?" (texto de Maggie del 01/10) hablaba de la seña del 50%. Se reescribió neutral, sin primera persona, con un `TODO(Maggie)` para que la confirme.
- Las capturas del hero van commiteadas en `docs/capturas/`.

**Qué se hizo:**

- **Migración 0006:** `sena_porcentaje` en 100, como default y en los workshops existentes. Los nombres internos (`sena_porcentaje`, `monto_sena`, `pendiente_sena`) no cambian.
- **Textos:** "seña" pasó a "pago" o "total" en el sitio, el formulario, el resultado, el título de la preferencia, el WhatsApp y el panel. El resumen de la inscripción quedó en una sola fila, "Total a pagar", y desaparecieron el saldo y su `TODO`. El campo de porcentaje ya no está en el panel.
- **Workshops pasados:** la lista vive en `data/site.ts` (`pastWorkshops`), con el placeholder "Foto próximamente". En mobile van en una fila con scroll horizontal; desde `sm`, en una grilla de 3×3.
- **Video:** un solo `<video>`. En mobile va de fondo con la capa oscura; en desktop, enmarcado al lado del texto, a 315×560 (el original es de 478×850), para que no se pixele.

**Correcciones de Claude Code durante el desarrollo:**

- **LCP del video:** Lighthouse tomaba el LCP cuando arrancaba el video, después de hidratar. El póster pasó a un `<img>` con `preload` (ver [errores.md](errores.md#el-lcp-del-video-esperaba-a-que-arrancara)).
- **Scroll-snap en mobile:** la primera tarjeta quedaba cortada, porque el snap ignoraba el padding. Se resolvió con `scroll-px-4`.

**Resultado:**

- Lint y build en verde.
- e2e: 110 en verde. En la primera corrida fallaba uno de la tienda, que esperaba "Precio a confirmar" en "Tarta de frutillas". Maggie había pedido $ 10 en todos los productos hasta cargar los reales. Ver [errores.md](errores.md#tests-atados-a-los-precios-y-destacados-reales).
- El test de `rate-limit` "no corría" por la config: su proyecto depende de `chromium`, y Playwright no corre un proyecto si falla una de sus dependencias.
- Lighthouse de `/workshops`: 100 / 100 / 100. El LCP observado es igual al de `main`, y el simulado sube 0,17 s (ver [lighthouse.md](lighthouse.md#workshops-con-el-video-del-hero)).

## 28/10/2026

### PR #21 · Carrito y pedidos de la tienda, PR 1 de 2: compra (`feat/carrito`)

**Pedido:** que la tienda venda. Carrito en el navegador, checkout con entrega, día y horario, pago del 100% con Checkout Pro y el registro del pago. Las reglas son de Maggie (ver [contenido-maggie.md](contenido-maggie.md#pedidos-de-la-tienda-confirmado-por-maggie-2810)). **Pagar no confirma el pedido:** Maggie lo acepta o lo rechaza. La pantalla para eso va en el PR 2; acá quedan las funciones de la base, con tests.

**Decisiones de Catalina durante el plan:**

- Los tamaños con "Precio a confirmar" no van al carrito. Si son los únicos, el producto muestra "Consultar precio por WhatsApp", y `crear_pedido` los rechaza.
- Si el producto tiene sabores, hay que elegir uno. La decoración es opcional ("Sin decoración").

**Decisiones de Claude Code (a revisar):**

- Las 48 h se cuentan hasta el **inicio** de la franja.
- Los feriados no se contemplan: queda un `TODO(Maggie)`.
- Un pago aprobado que llega con el pedido ya vencido igual lo pasa a `pagado`: no hay cupo que cuidar y Maggie lo confirma igual.
- Un segundo pago aprobado del mismo pedido queda para devolver (`pago_duplicado`).
- El `external_reference` lleva prefijo (`pedido:` / `inscripcion:`), y el id solo se sigue leyendo como inscripción.
- La `confirmar_pago` vieja queda como envoltorio, así el deploy anterior sigue andando entre la migración y el deploy nuevo.

**Qué se hizo:**

- **Migración 0007:**
  - tablas `pedidos` (con `numero` para WhatsApp) y `pedido_items` (snapshot; si se borra el producto, `producto_id` queda en null);
  - `crear_pedido` (solo `service_role`), que valida todo y calcula los precios;
  - `pagos` de una inscripción **o** un pedido, y `confirmar_pago(tipo, id, …)`;
  - `aceptar_pedido` y `rechazar_pedido` (solo admin);
  - RLS: nadie anónimo lee pedidos.
- **Reglas en una sola config:** `data/site.ts` → `pedidos`. El "Desde $ 400.000 · 10 km" del sitio sale de ahí.
- **Carrito:** contexto de React + `localStorage` con versión y zod al leer, y `useSyncExternalStore` para que no haya mismatch de hidratación.
  - El contador del header es visual; el total va en el `aria-label` y "Agregaste … al pedido" se anuncia por `aria-live`.
  - `/carrito` revisa contra `GET /api/v1/productos` al abrir: avisa si un producto ya no está y bloquea "Continuar", o si cambió el precio, y lo actualiza.
- **Checkout:** el mismo esquema zod en el cliente y en `POST /api/v1/pedidos` (rate limit, Origin, errores de `withApi`).
  - El envío queda deshabilitado, con la explicación, si el total no llega a $ 400.000.
  - Las franjas dependen del día, y un domingo avisa apenas se elige.
  - Los errores de negocio de la base (`HB422` con el campo en el `hint`) llegan como 400 en ese campo.
- **Resultado:** `/pedido/resultado` concilia con MP igual que la inscripción y vacía el carrito cuando el pago está aprobado.
- **El detalle del producto** muestra el formulario cuando se puede pedir. En la tienda, el botón "Muy pronto" pasó a "Elegir".

**Limitación conocida:** las devoluciones de pedidos todavía no se listan en el panel ("Para devolver" sale de las inscripciones). Las muestra el PR 2.

**Correcciones de Claude Code durante el desarrollo** (detalle en [errores.md](errores.md)):

- **zod en todas las páginas:** el provider del carrito traía `zod` completo al layout, y `/tienda` mobile bajó ~13 puntos. Se separó lo que no valida y el esquema usa `zod/mini`, cargado cuando el navegador está libre. La diferencia con `main` quedó dentro del ruido.
- **Carrera en el carrito:** la revisión de precios pisaba una línea que se había quitado mientras tanto. Ahora aplica el cambio sobre el carrito actual.
- **CLS:** el footer saltaba cuando aparecía el carrito (0,363 en el checkout mobile). Con `min-h-svh` quedó en 0 a 0,023.
- **Ids de pago repetidos entre workers** en los e2e: ahora llevan el pid.
- **Locators:** la tarjeta de la tienda tiene un segundo link al detalle ("Elegir"), así que los tests de la tienda buscan el nombre exacto.

**Resultado:**

- Lint y build en verde.
- e2e: 159 de 159, incluido rate limit. Hay 48 tests nuevos: 16 en `pedidos-unit`, 21 en `pedidos`, 10 en `carrito` y 1 en `pagos` (la referencia vieja de las inscripciones). Al terminar no queda nada de prueba en la base.
- Lighthouse: Accessibility y Best Practices en 100 en tienda, carrito y checkout, mobile y desktop. El SEO de carrito y checkout es 63 por el `noindex`, a propósito (ver [lighthouse.md](lighthouse.md#tienda-carrito-y-checkout-pedidos)).
- La migración 0007 la corrió Catalina en el SQL Editor antes de la suite.
