# Mockup de Home Bakery

Diseño aprobado del sitio, exportado de la herramienta de diseño. Es la **referencia visual** para implementar cada pantalla: estructura, orden de secciones, tamaños de letra, espaciados, radios y colores.

## Cómo leer estos archivos

- Son HTML con estilos inline. Cada archivo es una pantalla completa.
- Tienen sintaxis propia de la herramienta de diseño que **no hay que copiar**: `<x-dc>`, `<helmet>`, `<sc-if>`, `<sc-for>`, `{{variable}}`, `data-props` y el `<script type="text/x-dc">`. Representan estados o listas del prototipo; en Next.js se resuelven con componentes, props y los datos de `lib/data.ts`.
- Los textos entre corchetes (`[$ precio]`, `[Nombre del workshop]`) son placeholders: el contenido real sale de `data/`.
- Los anchos fijos (1440 px desktop, 390 px mobile) son del lienzo de diseño. En el sitio real el layout es fluido y mobile-first: en desktop tomar el archivo de 1440 px, en mobile el de 390 px cuando exista.
- Las clases `.ph` son placeholders de fotos: se reemplazan por `next/image` con la foto real.

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

- Colores: hueso #F5F4F0 (fondo), carbón #2F2F2F (texto), chocolate #5E4A33 (botones, bandas, footer), taupe #A88B6C (círculo del logo), arena #EAE3D8 (secciones alternas), placeholder #DCD1C3, texto secundario #6B5A50, bordes #E5DDD2, WhatsApp #25D366 con texto #0B3B1E.
- Tipografías: Gilda Display (títulos), Mrs Saint Delafield (una palabra manuscrita por título), Oswald (etiquetas en mayúscula), DM Sans (cuerpo y botones).

## Notas de interpretación (última revisión del diseño)

- En `inicio-desktop.html` hay una `<section>` vacía entre "Seguí lo que sale del horno" y "Retiros": la sección "Mesas dulces y eventos" se sacó del diseño. No hay que implementarla.
- Footer del inicio (desktop): logo blanco sin círculo, una columna con título "Inicio" y links a Tienda, Workshops y Maggie (el link "Maggie" va a `/maggie`), columna de Retiros y columna de Contacto. Sin tagline ni línea de copyright.
- Botón de WhatsApp: círculo de 60 px solo con el ícono, verde #25D366 con ícono #0B3B1E, fijo abajo a la derecha, en desktop y mobile.
- Menú desplegable mobile (cambio intencional respecto de `inicio-mobile.html`): los links usan el estilo de la etiqueta "Foto próximamente" (DM Sans, medium, mayúsculas, `tracking-foto`) en 15 px, en lugar de Gilda Display en 26 px. Cada link tiene 16 px de padding vertical para llegar a al menos 44 px de alto (WCAG 2.5.8). El link de la página actual va en chocolate; los demás, en carbón.
