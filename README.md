# Home Bakery

Sitio web de **Home Bakery**, un emprendimiento de pastelería casera que vende productos artesanales y ofrece workshops para aprender a hacerlos en casa.

Es un trabajo práctico universitario. Se evalúan especialmente:

- HTML semántico
- Diseño responsive (mobile-first)
- Accesibilidad (WCAG AA)
- Consistencia visual

## Deploy

🔗 **Sitio publicado:** [home-bakery-brown.vercel.app](https://home-bakery-brown.vercel.app)

## Stack

- [Next.js 16](https://nextjs.org) con App Router y Turbopack
- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- ESLint
- GitHub Actions para CI (lint y build en cada PR)

## Cómo correrlo en local

Requisitos: **Node.js 20.9 o superior** (recomendado: la versión LTS actual) y npm.

```bash
# 1. Clonar el repositorio
git clone https://github.com/trevisancata/home-bakery.git
cd home-bakery

# 2. Instalar dependencias
npm install

# 3. Levantar el servidor de desarrollo
npm run dev
```

Después abrí [http://localhost:3000](http://localhost:3000) en el navegador.

### Otros scripts

| Comando         | Qué hace                                   |
| --------------- | ------------------------------------------ |
| `npm run dev`   | Servidor de desarrollo con recarga en vivo |
| `npm run build` | Build de producción                        |
| `npm start`     | Sirve el build de producción               |
| `npm run lint`  | Revisa el código con ESLint                |
