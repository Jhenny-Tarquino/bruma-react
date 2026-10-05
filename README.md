# BRUMA

Landing page para la agencia audiovisual BRUMA, migrada a React y Vite.

## Requisitos

- Node.js 20.19+ o 22.12+
- npm

## Desarrollo

```bash
npm install
npm run dev
```

Vite muestra la URL local al iniciar, normalmente `http://localhost:5173/`.

## Compilación

```bash
npm run build
```

La página presenta los servicios, paquetes, comparación, proceso y formulario de contacto de BRUMA. El formulario muestra una confirmación local y todavía no envía datos a un servicio externo.

## Rutas SPA

La navegación conserva la landing completa y lleva a sus secciones sin recargar el documento. Las rutas disponibles son `/`, `/servicios`, `/showreel`, `/bruma`, `/paquetes`, `/comparar`, `/proceso`, `/confianza` y `/contacto`. Las rutas desconocidas muestran una vista 404.

## GitHub Pages

El workflow `.github/workflows/deploy.yml` compila y publica `dist` en cada push a `main`. El build crea `dist/404.html` junto a `index.html` para que GitHub Pages pueda abrir y recargar rutas cliente.
