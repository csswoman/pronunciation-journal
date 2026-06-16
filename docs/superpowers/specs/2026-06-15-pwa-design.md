# PWA — Pronunciation Journal

**Date:** 2026-06-15  
**Status:** Approved

## Goal

Convert the existing Next.js 15 app into a Progressive Web App that is installable on mobile and desktop, and works offline for core practice flows (vocabulary, flashcards via Dexie). Online-only features fail gracefully with a clear message.

## Approach

`@serwist/next` — the actively maintained successor to `next-pwa`, with native App Router support and Workbox v7 under the hood.

## Dependencies

```
@serwist/next
serwist
```

## Files to create

### `app/sw.ts` — Custom service worker
- Imports Serwist runtime
- **Cache First** for static assets (JS, CSS, images, fonts) — serve from cache, update in background
- **Network First** for navigation routes — try network, fall back to `/offline` page on failure
- **Excluded from cache** (always go to network, let errors propagate to UI):
  - `/api/gemini/*`
  - `/practice/sounds/*`
  - `/api/auth/*`

### `app/manifest.ts` — Web App Manifest (Next.js native)
```
name: "Pronunciation Journal"
short_name: "PronJournal"
description: "Track and improve your pronunciation"
display: "standalone"
orientation: "portrait"
background_color: "#ffffff"
theme_color: oklch(65% 0.18 210)   ← accent token approximation
start_url: "/home"
scope: "/"
icons: 192, 512, apple-touch-icon 180
```

### `app/offline/page.tsx` — Offline fallback page
- Simple page shown when navigation fails due to no network
- Lists what works offline: vocabulary practice, flashcard review (Dexie-backed)
- Consistent with app shell styling (tokens, AppShell wrapper)

### `public/icons/` — App icons
- `icon.svg` — Base SVG: rounded square with accent background, "PJ" in Fraunces white, centered
- `icon-192.png` — 192×192 PNG (for manifest)
- `icon-512.png` — 512×512 PNG (for manifest / splash)
- `apple-touch-icon.png` — 180×180 PNG (for iOS)

> Icon design is intentionally simple and can be refined later. SVG uses `font-family="Fraunces, serif"` — browsers rendering the install prompt will already have the font loaded from the app.

## Files to modify

### `next.config.js`
Wrap existing config with `withSerwist({ swSrc: 'app/sw.ts', swDest: 'public/sw.js', ... })`.

### `app/layout.tsx`
Add to `<head>`:
```html
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<meta name="theme-color" content="..." />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```
Next.js links the manifest automatically when `app/manifest.ts` exists.

### `.gitignore`
Add `public/sw.js` and `public/sw.js.map` (generated at build time).

## Offline behavior by route

| Route | Offline behavior |
|-------|-----------------|
| `/home`, `/practice/*`, `/vocabulary` | Cached — works offline |
| `/practice/sounds/*` | Network only — shows "needs connection" UI (existing error handling) |
| `/api/gemini/*` | Network only — existing error handling in components |
| `/api/auth/*` | Network only — Supabase auth not cached |
| Any uncached route | Redirected to `/offline` page |

## Out of scope

- Push notifications
- Background sync (Dexie already handles local-first; Supabase sync runs when online)
- Icon refinement (deferred — swap SVG/PNGs when final brand assets are ready)
