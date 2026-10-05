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
