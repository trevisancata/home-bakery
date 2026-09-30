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

Lo que falta completar con Maggie está marcado con `TODO` en `data/site.ts`, `data/products.ts` y `data/workshops.ts`.
