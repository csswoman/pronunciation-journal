# PWA — english-journal

**Date:** 2026-06-12  
**Status:** Approved for implementation

## Objetivo

Convertir english-journal en una Progressive Web App instalable con soporte offline robusto. Prioridades iguales: instalación nativa (Add to Home Screen) y funcionamiento sin conexión.

## Secciones offline

Las siguientes secciones deben funcionar sin internet:

- `/practice/**` — sesiones SRS, flashcards, exercises (ya persiste en Dexie)
- `/lexicon/**` — vocabulario y palabras guardadas
- `/courses/**`, `/mini-lessons/**` — lecciones previamente visitadas
- `/progress`, `/dashboard` — estadísticas con datos de Dexie

Secciones siempre online (no se cachean):
- `/practice/sounds` — usa Supabase directamente, sin capa Dexie
- `/api/**` — Gemini y Supabase calls no tienen sentido offline

## Dependencia principal

`@ducanh2912/next-pwa` — fork activo compatible con Next.js 15 App Router y Workbox 7.

## Componentes del diseño

### 1. Web App Manifest (`app/manifest.ts`)

Exporta el manifest usando la API nativa de Next.js 15 (`MetadataRoute.Manifest`):

```ts
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "English Journal",
    short_name: "EJ",
    description: "Tu diario de inglés — practica, aprende y progresa",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#5B6CF7",        // aproximación hex de --primary-500 (hue 250)
    background_color: "#f5f5f7",   // aproximación hex de --bg claro
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
```

Meta tags adicionales en `app/layout.tsx`:
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
- `<meta name="apple-mobile-web-app-title" content="EJ">`
- `<link rel="apple-touch-icon" href="/icons/icon-192.png">`

### 2. Íconos PNG (`scripts/generate-pwa-icons.mjs`)

Script de Node que genera los PNGs desde `app/icon.svg` usando `sharp`:

| Archivo | Tamaño | Uso |
|---|---|---|
| `public/icons/icon-192.png` | 192×192 | Android, manifest |
| `public/icons/icon-512.png` | 512×512 | Splash screen, manifest |
| `public/icons/icon-512-maskable.png` | 512×512 | Android maskable (padding 20%) |

`sharp` se instala como devDependency y se puede remover después de generar los íconos (o mantener para CI).

### 3. Service Worker (`next.config.js` + `@ducanh2912/next-pwa`)

Configuración en `next.config.js` wrapeando el config existente con `withPWA`:

```js
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  workboxOptions: {
    runtimeCaching: [ /* ver abajo */ ],
  },
})
module.exports = withPWA(nextConfig)
```

#### Estrategias de cache

| Patrón | Estrategia | Razón |
|---|---|---|
| Navegación (HTML) | `NetworkFirst`, fallback `/offline` | Páginas frescas cuando hay red |
| `/_next/static/**` | `CacheFirst`, 365 días | Assets con hash — nunca cambian |
| `/icons/**`, `/fonts/**` | `CacheFirst`, 30 días | Assets estáticos |
| `/audio/**` (OGG/Opus) | `CacheFirst`, max 100 archivos, 30 días | Audio de palabras practicadas |
| Imágenes | `StaleWhileRevalidate`, max 60 archivos | Actualización en background |
| `/api/**` | **Excluido** | Gemini/Supabase no tienen sentido offline |

#### Comportamiento en actualización

Cuando el SW detecta una nueva versión: muestra el banner `OfflineUpdateBanner` (ver §5). El usuario decide cuándo recargar.

### 4. Página offline (`app/offline/page.tsx`)

Página estática servida por el SW cuando una ruta no está en cache y no hay conexión:

- Mensaje: "Sin conexión" + "Puedes seguir practicando"
- Link directo a `/practice`
- Usa tokens de diseño existentes (`bg-bg-base`, `text-fg-default`, etc.)
- Sin Server Components ni fetching — puramente estática

### 5. Hook + banner de estado de conexión

**`hooks/useOnlineStatus.ts`**  
Hook que escucha `window.addEventListener('online'/'offline')` y retorna `{ isOnline: boolean }`.

**`components/ui/OfflineBanner.tsx`**  
Banner minimalista en la parte inferior del viewport. Se monta en `app/layout.tsx` (client component):

- Offline: "Sin conexión — los cambios se sincronizarán cuando vuelvas a conectarte"
- Vuelta online: "Conexión restaurada" con auto-dismiss a los 3s
- Animación de entrada/salida con `transition` de Tailwind

El banner **no bloquea** la navegación ni muestra modales.

## Archivos afectados

```
app/
  layout.tsx                    — meta tags iOS, montar OfflineBanner
  manifest.ts                   — nuevo
  offline/
    page.tsx                    — nuevo

components/ui/
  OfflineBanner.tsx             — nuevo

hooks/
  useOnlineStatus.ts            — nuevo

public/
  icons/
    icon-192.png                — generado
    icon-512.png                — generado
    icon-512-maskable.png       — generado

scripts/
  generate-pwa-icons.mjs        — nuevo (devDependency)

next.config.js                  — wrappear con withPWA
```

## Dependencias nuevas

| Paquete | Tipo | Razón |
|---|---|---|
| `@ducanh2912/next-pwa` | dependency | SW + Workbox para Next.js 15 |
| `sharp` | devDependency | Generar íconos PNG desde SVG |

## .gitignore

Agregar al `.gitignore`:
```
.superpowers/
```

Y al output del SW generado por next-pwa (ya lo maneja automáticamente en `public/`):
```
public/sw.js
public/workbox-*.js
public/sw.js.map
public/workbox-*.js.map
```

## Restricciones

- El SW solo se activa en `production` (`disable: process.env.NODE_ENV === 'development'`). En dev se trabaja normalmente.
- No se cachea nada de `/api/**`.
- `/practice/sounds` es online-only per CLAUDE.md — no se incluye en estrategia offline.
- Los archivos SW generados (`sw.js`, `workbox-*.js`) se agregan al `.gitignore`.
- No se duplica estado entre Dexie y el SW cache — Dexie sigue siendo la fuente de verdad para datos de usuario; el SW cache solo maneja assets y shells de página.
