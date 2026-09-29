# Comparaciones con el mockup

Capturas generadas por `npm run compare`. No se versionan: solo este README.

## Cómo correrlo

1. Levantá el sitio con `npm run dev` (o apuntá a otro servidor con `BASE_URL=…`).
2. En otra terminal: `npm run compare` (todas las pantallas) o `npm run compare -- tienda`.

La primera vez hace falta instalar el navegador: `npx playwright install chromium`.

## Qué genera

Por cada pantalla y ancho (1440 px contra el archivo desktop, 390 px contra el mobile cuando existe):

- `<pantalla>-<ancho>.png`: tres columnas, mockup · sitio · diferencia. En la diferencia, lo negro coincide y lo que se ve con color es distinto.
- `<pantalla>-<ancho>-mockup.png` y `<pantalla>-<ancho>-sitio.png`: cada captura suelta.

El script resuelve la sintaxis propia de la herramienta de diseño (`<sc-if>`, `<sc-for>`, `{{…}}`) con los valores del `<script type="text/x-dc">` de cada archivo, así que los estados que se ven son los iniciales del prototipo (menú cerrado, filtro "Todo").
