# Mockup de Home Bakery

Diseño aprobado del sitio, exportado de la herramienta de diseño. Es la **referencia visual** para implementar cada pantalla: estructura, orden de secciones, tamaños de letra, espaciados, radios y colores.

Versión actual: **v6 (04/10/2026)**, con los cambios que pidió Maggie el 01/10. Ver "Cambios de la v6" más abajo.

## Cómo leer estos archivos

- Son HTML con estilos inline. Cada archivo es una pantalla completa.
- Tienen sintaxis propia de la herramienta de diseño que **no hay que copiar**: `<x-dc>`, `<helmet>`, `<sc-if>`, `<sc-for>`, `{{variable}}`, `data-props` y el `<script type="text/x-dc">`. Representan estados o listas del prototipo; en Next.js se resuelven con componentes, props y los datos de `lib/data.ts`.
- Los textos entre corchetes (`[$ precio]`, `[Nombre del workshop]`) son placeholders: el contenido real sale de `data/` (o de Supabase cuando esté conectado).
- Los anchos fijos (1440 px desktop, 390 px mobile) son del lienzo de diseño. En el sitio real el layout es fluido y mobile-first: en desktop tomar el archivo de 1440 px, en mobile el de 390 px cuando exista.
- Las clases `.ph` son placeholders de fotos o videos: se reemplazan por `next/image` (o `<video>`) con el material real.
- Las rutas a imágenes apuntan a `public/` (`../../public/...`), así que se ven al abrir el HTML desde el repo.

## Pantallas y rutas

| Archivo | Ruta |
|---|---|
| inicio-desktop.html / inicio-mobile.html | `/` |
| tienda.html | `/tienda` |
| carrito.html | `/carrito` |
| estado-pedido.html | `/pedido/[codigo]` |
| workshops.html | `/workshops` |
| inscripcion-workshop.html | `/workshops/[slug]/inscripcion` |
| maggie.html | `/maggie` |
| admin-*.html | `/admin/...` (login, pedidos, productos, workshops, ajustes) |
| guia-de-marca.html | Referencia de colores, tipografías y logo |

## Tokens

- Colores: hueso #F5F4F0 (fondo), carbón #2F2F2F (texto), chocolate #5E4A33 (botones, bandas, footer), taupe #A88B6C (círculo del logo), arena #EAE3D8 (secciones alternas), placeholder #DCD1C3, texto secundario #6B5A50, bordes #E5DDD2, WhatsApp #25D366 con texto #0B3B1E, crema sobre foto #EADFCF.
- Tipografías: Gilda Display (títulos), Mrs Saint Delafield (una palabra manuscrita por título), Oswald (etiquetas en mayúscula), DM Sans (cuerpo y botones).

## Cambios de la v6 (pedidos de Maggie, 01/10)

- **Logo**: se usa solo "home bakery", sin "cakes & pastries" (queda más grande y legible). Archivos: `public/brand/homebakery_logo_sin_tagline.png` (negro) y `public/brand/homebakery_logo_sin_tagline_white.png` (blanco). Los originales con tagline quedan en el repo pero ya no se usan.
- **Portada del inicio**: carrusel a todo el ancho (no más foto a la derecha con bordes redondeados), 720 px de alto en desktop y 640 px en mobile, con 3 o 4 diapositivas que pueden ser foto o video. Encima, una capa oscura `rgba(36,28,22,.42)` para que el texto blanco se lea sobre cualquier foto. Textos de Maggie: eyebrow "Artesanal, delicado y casero", título "Pastelería y *workshops*", bajada "Workshops reducidos en mi cocina y pastelería por encargo. Pedidos con 48 h de anticipación. Take away en San Isidro."
- **Carrusel accesible** (WCAG 2.2.2): botones anterior / siguiente, puntos por diapositiva (área táctil de 44 px), y botón de **pausa** visible. Con `prefers-reduced-motion` no avanza solo. Los videos van `muted`, `loop`, `playsInline`, sin audio y con póster. `aria-roledescription="carrusel"` en la sección y `"diapositiva"` en cada slide.
- **Presentación en el inicio**: foto real de Maggie (`public/fotos/maggie-presentacion.jpg`) y dos frases tomadas de su texto.
- **Banda de workshops en el inicio**: deja de ser "Workshop del mes". Ahora presenta qué son los workshops ("Grupos reducidos en mi cocina") con video de fondo, y la próxima fecha queda en una línea chica.
- **/workshops reorganizada**: 1) portada con video de fondo y botón de pausa, 2) "Cómo enseño" con el texto de Maggie, 3) "Cómo es un workshop" en 4 pasos + datos (2 h, hasta 8 personas, San Isidro, seña del 50%), 4) **Agenda** con las próximas fechas (el workshop del mes es la primera fila, sin tarjeta gigante), 5) "Así fueron los workshops" con nombre y mes/año, 6) workshop personalizado, 7) preguntas frecuentes con las respuestas reales de Maggie.
- **/maggie**: hero con la foto real y "Mi historia" con el texto completo de Maggie en tres partes (Un ciclo que se cerró / Formación / Hoy). Se sacó la línea de tiempo con años (no tenemos los años).
- **Inscripción**: ahora se reserva con **seña del 50%** por Mercado Pago. El resumen muestra total, seña y saldo. Cuándo y cómo se paga el saldo está pendiente de confirmar con Maggie.

## Notas de interpretación

- En `inicio-desktop.html` hay una `<section>` vacía entre "Seguí lo que sale del horno" y "Retiros": la sección "Mesas dulces y eventos" se sacó del diseño. No hay que implementarla.
- Footer del inicio (desktop): logo blanco sin círculo, una columna con título "Inicio" y links a Tienda, Workshops y Maggie (el link "Maggie" va a `/maggie`), columna de Retiros y columna de Contacto. Sin tagline ni línea de copyright.
- Botón de WhatsApp: círculo de 60 px solo con el ícono, verde #25D366 con ícono #0B3B1E, fijo abajo a la derecha, en desktop y mobile.
- Menú desplegable mobile: los links usan el estilo de la etiqueta "Foto próximamente" (DM Sans, medium, mayúsculas, `tracking-foto`) en 15 px. Cada link tiene 16 px de padding vertical para llegar a al menos 44 px de alto (WCAG 2.5.8). El link de la página actual va en chocolate; los demás, en carbón. (Ya está así en `inicio-mobile.html` desde la v6.)
- Textos de Maggie: se corrigió solo ortografía (tildes, mayúsculas). No se cambió el contenido. Las frases del inicio son recortes textuales de su presentación.
