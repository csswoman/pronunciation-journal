# Plan 056: Cargar cada runtime cliente solo cuando la persona lo necesita

> **Executor instructions**: Ejecuta este plan después de Plan 055. Sigue cada
> paso y su verificación. Actualiza la fila en
> `plans/series-7-light-client-and-level-packs.md` al terminar.
>
> **Drift check (run first)**:
> `git diff --stat 26c05b4f..HEAD -- components/offline components/tracking components/search components/layout/Sidebar.tsx components/practice/essential-words/EssentialWordsPageHeader.tsx app/offline app/'(authenticated)'/test app/'(authenticated)'/dev scripts/generate-content-index.ts lib/search tests/performance`
> Si cambió la propiedad de una ruta, un import ya es dinámico o Serwist dejó de
> servir `/offline` conservando el pathname original, STOP y reevalúa el paso.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: Plan 055
- **Category**: perf
- **Planned at**: commit `26c05b4f`, 2026-09-28
- **Execution status**: DONE — the `/daily` +650.6 KB was a measurement artifact (baseline built without `.env.local`); like-for-like `/daily` is −0.9%.

## Why this matters

El shell compartido sigue cerca de 166 KB gzip; el peso creció dentro de
runtimes cliente de rutas concretas. `/offline` importa simultáneamente Daily,
Auth y su propio hub; Tracking monta herramientas cerradas; la búsqueda empaca
un índice generado de unos 342 KB raw como JavaScript; y dos herramientas de
desarrollo entran al build productivo. Este plan conserva funcionalidades y
reduce lo descargado antes de la primera interacción.

## Current state

- `components/offline/OfflineEntry.tsx:5-7` importa estáticamente
  `AuthProvider`, `DailyChecklist` y `OfflineHubClient`; elige una rama después
  del montaje mediante `window.location.pathname`.
- `components/offline/OfflineHubClient.tsx:17` importa `GrammarStudyDeck` aunque
  solo se usa cuando `activeLesson` existe.
- `components/tracking/TrackingClient.tsx:16-30` importa seis modales,
  `PracticeSession` y `WordCarousel`; las herramientas se usan solo tras acciones.
- El commit `2b56dc10` contiene el patrón vigente: `next/dynamic`, montaje
  condicional y preload en hover/focus para `QuickAddModal`.
- `lib/search/generated-content-index.ts` mide aproximadamente 342 KB raw;
  `components/search/SearchModal.tsx:6` lo importa estáticamente junto a Fuse.
- `app/(authenticated)/test/page.tsx:2` y `app/(authenticated)/dev/sounds/page.tsx:2`
  importan herramientas antes del guard de producción. El patrón correcto está
  en `app/(authenticated)/dev/kokoro-bench/page.tsx`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm vitest run components/tracking/__tests__/TrackingClient.test.tsx lib/search/__tests__/searchContent.test.ts lib/offline/__tests__/download-manager.test.ts` | pass |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Bundle | `pnpm analyze:bundle:check` | reporta reducción o delta explicado |
| Runtime | `pnpm test:perf:cold-nav` | rutas críticas dentro del presupuesto de Plan 055 |

## Suggested executor toolkit

- Lee `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`.
- Usa `vercel-react-best-practices` para límites cliente y `next-dev-loop` para
  aceptación de producción.

## Scope

**In scope**:

- `components/offline/OfflineEntry.tsx`
- `components/offline/OfflineHubClient.tsx`
- un componente nuevo bajo `components/offline/` si hace falta aislar Daily
- `components/tracking/TrackingClient.tsx`
- tests focalizados de Offline y Tracking
- `components/search/SearchModal.tsx`
- `lib/search/contentIndex.ts`
- `lib/search/generated-content-index.ts` (retirar al final)
- `public/search/content-index.json` (generated, create)
- `scripts/generate-content-index.ts`
- `lib/search/__tests__/searchContent.test.ts`
- `components/practice/essential-words/EssentialWordsPageHeader.tsx`
- `app/(authenticated)/test/page.tsx`
- `app/(authenticated)/dev/sounds/page.tsx`
- `app/layout.tsx`, `components/pwa/ServiceWorkerRegistration.tsx`, and `app/sw-runtime-caching.ts`
- `next.config.mjs` and `package.json` to generate the production worker through the installed Serwist Webpack integration
- `tests/performance/service-worker-offline.spec.ts` and `tests/performance/plan056-route-payloads.spec.ts`
- `docs/architecture/performance.md`

**Out of scope**:

- Cambiar Dexie, contratos de progreso o selección pedagógica.
- Quitar capacidades offline existentes.
- Cambiar el diseño visual aparte de estados de carga ya soportados.
- Cambiar la estrategia de paquetes CEFR; pertenece al Plan 057.

## Git workflow

- Rama opcional: `codex/056-thin-client-boundaries` desde `dev`.
- No commit ni push sin orden explícita.
- Commit sugerido: `perf(client): defer route interaction runtimes`.

## Steps

### Step 1: Separar los árboles de Offline y Daily

Mantén `OfflineEntry` como componente cliente pequeño que determina el pathname.
Reemplaza imports estáticos por dos `next/dynamic` explícitos en top level. Monta
solo la rama elegida. La rama Daily debe envolver `DailyChecklist` en Auth sin
hacer que el hub normal importe el cliente Supabase.

En `OfflineHubClient`, carga `GrammarStudyDeck` solo cuando `activeLesson` deje
de ser `null`. Conserva una UI de carga accesible con `role="status"`.

**Verify**: test nuevo que mockea ambos loaders y demuestra que `/offline` no
monta Daily y que el pathname `/daily` no monta el hub.

### Step 2: Diferir herramientas de Tracking

Aplica el patrón del commit `2b56dc10` a Quick Add y al resto de modales. Monta
cada modal solo cuando su estado de apertura sea verdadero. Extrae el runner de
repaso a un componente dinámico montado solo cuando `activeExercises` tenga
contenido. Conserva preload en hover/focus de los CTA principales.

Actualiza `TrackingClient.test.tsx` para cubrir apertura por teclado, edición,
borrado y entrada a sesión después del split.

**Verify**: `pnpm vitest run components/tracking/__tests__/TrackingClient.test.tsx` → pass.

### Step 3: Servir el índice de búsqueda como datos bajo demanda

Cambia `scripts/generate-content-index.ts` para producir
`public/search/content-index.json` versionado. `lib/search/contentIndex.ts` debe
exponer un loader asíncrono con promesa/cache en memoria, validación manual de
forma básica y errores públicos. No introduzcas Zod en cliente.

En `SearchModal`, no descargues el índice mientras está cerrado. Al abrirlo,
precarga datos; importa `fuse.js` al aparecer la primera consulta no vacía.
Mantén sugerencias frecuentes disponibles sin índice. Haz también dinámico el
modal de `EssentialWordsPageHeader`, como ya ocurre en Sidebar.

Retira `lib/search/generated-content-index.ts` solo después de que el generador,
tests y consumidores ya usen el JSON.

**Verify**: el test prueba carga exitosa, fallo/retry y que una consulta vacía no
instancia Fuse; `pnpm vitest run lib/search/__tests__/searchContent.test.ts` → pass.

### Step 4: Excluir herramientas de desarrollo

Replica exactamente el patrón de `dev/kokoro-bench/page.tsx`: función async,
import dentro de `NODE_ENV === 'development'`, `notFound()` fuera de esa rama.
Aplicar a `/test` y `/dev/sounds`.

**Verify**: tras `pnpm build`, sus page chunks no deben contener las cadenas
distintivas de `ExerciseTestHub` ni `SoundLab`; ambas rutas deben responder 404
con `next start` y abrir con `pnpm dev`.

### Step 5: Medir y documentar

Ejecuta el build limpio y Plan 055. Registra antes/después para `/offline`,
`/tracking`, `/practice` y el inventario publicado. Una reducción de manifiesto
sin reducción de tráfico real se documenta como split estructural, no como
ahorro descargado.

**Verify**: `pnpm type-check && pnpm lint` → exit 0; `pnpm build`; luego
`pnpm analyze:bundle:check` y `pnpm test:perf:cold-nav`.

## Execution log (2026-09-28)

- Steps 1 and 2 are implemented. Offline branch tests, deferred Coach-panel test, Tracking interaction tests, and download-manager tests pass; 29 focused tests passed across 6 files.
- Step 3 was initially stopped because the Service Worker had no rule for `/search/content-index.json`. After the user's authorization, the index was moved to generated public JSON, validated and cached in memory; the closed modal does not fetch it, and Fuse loads only after a non-empty query. The retired module was removed after the consumers and tests migrated.
- Step 4 is implemented and verified: both pages load in the existing development server; production requests return HTTP 404; the production client chunk scan found no `ExerciseTestHub` or `SoundLab` strings. The page-level `notFound()` streamed with HTTP 200, so `proxy.ts` returns an early production 404 for these exact paths.
- The initial Turbopack build did not regenerate `public/sw.js`: Next 16 uses Turbopack by default, while the installed `@serwist/next` integration uses a Webpack plugin. The package build command now runs `next build --webpack`, and `register: false` leaves the production-only `ServiceWorkerRegistration` component as the single registration owner.
- Final verification: `pnpm type-check`, `pnpm lint`, `git diff --check`, and `pnpm build` passed. The focused Vitest command passed 41 tests across 9 files. `pnpm analyze:bundle:check` passed: root main 170.1 KB gzip, max initial route 549.9 KB gzip, and 1,495.2 KB gzip across 143 published chunks (2,805 KB effective total threshold).
- Final cold-navigation capture (unique JavaScript URLs, raw KB): `/offline` 670.0 (baseline 2,379.9; 15 vs 34 URLs); `/daily` 2,719.0 (baseline 2,068.4; 55 vs 33); `/tracking` 1,401.8 (baseline 1,859.8; 39 vs 36); `/practice` 1,997.4 (baseline 1,925.7; 47 vs 31). The baseline build was Turbopack (`KQbMr1ZvWaZmt3tdUajL7`) and the current build is Webpack (`7Y2wxUUMacGaVXNLq9H6N`), so these deltas are observations, not causal comparisons. The `/daily` increase is 650.6 KB raw (+31.5%) and remains unattributed.
- The 14 initial `/offline` JavaScript responses contain no `GoTrueClient`, `RealtimeClient`, `@supabase/supabase-js`, `getSupabaseBrowserClient`, or `AuthProvider`. Coach/Auth code is dynamically mounted only when the person opens its options. The loading and error UI was checked in light, dark, and purple-accent themes.
- Offline runtime acceptance now passes in a clean production browser using the anonymous session created by the Playwright setup: the worker is active and controls the page, the search JSON is readable offline from its dedicated cache, `/daily?step=review` survives an offline reload and shows the Daily surface, and the route works again after reconnecting. This does not verify user-specific remote sync.
- `/daily` attribution (same day): rebuilding the current tree with Turbopack still gave `/daily` 3,052.5 KB, which ruled out the bundler switch. The Plan 055 baseline `KQbMr1ZvWaZmt3tdUajL7` was built in `.claude/worktrees/055-real-client-payloads` without `.env.local`: its client chunks contain no Supabase host (current build: 5 files), so `/daily` rendered the "Supabase not configured" branch. Rebuilt at `26c05b4f` with `.env.local` (`F8yaFxIcFO9SIQzqVYqki`) and measured with the same spec: `/offline` 2,379.9→674.2 KB (−71.7%), `/daily` 3,079.0→3,052.5 (−0.9%), `/tracking` 2,279.2→1,768.1 (−22.4%), `/practice` 2,345.1→2,345.2 (0%). No regression. Out of scope for a follow-up: 405.7 KB of Node polyfills only on `/daily`, and 382.1 KB of Zod on the client (shared with `/tracking` and `/practice`).
- `tsconfig.json` now excludes `tmp/`: the leftover baseline copy in `tmp/codex-plan056-baseline-20260928-1/` was breaking the type-check step in `next build`.

## Test plan

- Offline: una sola rama montada, fallback `/daily`, deck diferido y error del
  loader visible.
- Tracking: herramientas ausentes al inicio y funcionales tras abrirlas.
- Search: JSON bajo demanda, caché, retry, consulta vacía, resultados existentes.
- Producción: rutas dev inaccesibles y sin sus implementaciones exclusivas.
- Browser: claro/oscuro y hue alternativo solo si aparece una UI de carga nueva.

## Done criteria

- [x] `/offline` no importa estáticamente Daily, Supabase ni GrammarStudyDeck.
- [x] Tracking no monta modales o sesión cerrados.
- [x] El índice de búsqueda ya no se emite como módulo JS; el JSON generado ocupa 314,913 bytes frente a 349,688 bytes del módulo TS anterior.
- [x] `/test` y `/dev/sounds` no publican implementaciones exclusivas en producción.
- [x] Tests focalizados, type-check y lint pasan para los pasos implementados.
- [x] Build y medición de Plan 055 registran deltas observados y explican el aumento de `/daily`.
- [x] Service Worker registrado y controlando en producción; el JSON cacheado responde offline.
- [x] Fallback offline de `/daily` funciona con reload y reconexión en la sesión anónima de prueba.

## STOP conditions

- Serwist no conserva el pathname original al servir `/offline`.
- Un chunk diferido requerido por `/daily` no está disponible sin red.
- El JSON de búsqueda no puede cachearse bajo la política PWA actual.
- Un modal pierde estado introducido por el rediseño de Tracking.

## Maintenance notes

Todo trigger global puede ser eager; su implementación debe seguir diferida.
Los datasets generados grandes se sirven como recursos cacheables, no como
módulos JavaScript, salvo que una medición pruebe lo contrario.
