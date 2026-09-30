# Performance architecture and optimization baseline

This document records the project's performance boundaries, measurement
baseline, and architectural rules. Implementation work is tracked separately
in [`plans/README.md`](../../plans/README.md).

Last measured: 2026-09-14 (Plan 001: semántica de carga inicial vs total publicado).

## Baseline

Environment:

- Next.js 16.3.3 with Turbopack production build
- React 19.2.8
- Project runtime requirement: Node.js 24.x

Verification baseline:

- Bundle analysis: `pnpm analyze:bundle` → `bundle-summary.json` (CI enforces `pnpm analyze:bundle:check`)

### Client JavaScript (Turbopack build, re-baselined 2026-09-14)

Metrics from `scripts/analyze-bundle.mjs` (gzip via Node zlib, same machine as build):

| Metric | Raw | Gzip | CI Status |
|---|---:|---:|---|
| Root main entry (`build-manifest.json` root + polyfills) | 538 KB | 166 KB | Enforced (budget 168 KB) |
| Max Initial Route (`maxRouteGzipKB`, heaviest route) | ~1,200 KB | 361 KB | Enforced (budget 575 KB) |
| Published `static/chunks/*.js` (`publishedChunksGzipKB`, 177 files) | 7,884 KB | 2,376 KB | Enforced loose safety rail (budget 2,550 KB) |
| Deferred chunks (CMUdict dictionary probe) | 3,832 KB | 939 KB | Excluded from published total |

#### Metric Semantics

- **Initial Route Payload (`maxRouteGzipKB` / `routes[].gzipKB`)**: The union of client chunks
  actually required for a route's first client render, extracted from each route's
  `page_client-reference-manifest.js` (`clientModules`). Dynamic imports (`next/dynamic` /
  `react-loadable`) and deferred runtime modules are not bundled in initial route chunks.
  CI strictly enforces this budget.
- **Published Total (`publishedChunksGzipKB` / `allChunksGzipKB`)**: The sum of all emitted
  client chunk files written to `.next/static/chunks/*.js` (excluding deferred dictionary payloads).
  Subject to a loose safety rail budget (2,550 KB + 10% tolerance → 2,805 KB) to detect silent
  global code regressions while allowing legitimate chunk-splitting improvements.
- **Deferred Chunks (`deferredChunksGzipKB`)**: Large modules loaded only on demand via
  lazy evaluation (`await import(...)`), currently `cmu-pronouncing-dictionary` (~939 KB gzip).
  Content probes in `analyze-bundle.mjs` ensure the vendor payload does not accidentally slip
  into initial chunks.

CI budgets (`scripts/bundle-budget.json`, +10% tolerance):

| Metric | Budget gzip | Threshold (+10%) |
|---|---:|---:|
| `rootMainGzipKB` | 168 KB | 184.8 KB |
| `maxRouteGzipKB` | 575 KB | 632.5 KB |
| `publishedChunksGzipKB` | 2,550 KB | 2,805.0 KB |

Historical route-level gzip totals (pre-Turbopack baseline, 2026-06-21) remain
below for trend comparison only — re-measure per-route after adding route-level
parsing to `analyze-bundle.mjs` if needed.

## Current optimization backlog

The executable plans are deliberately separate from this architectural
document:

| Plan | Objective |
|---|---|
| [024](../../plans/024-defer-global-client-features.md) | Defer global AI Coach and Quick Add implementations |
| [025](../../plans/025-split-words-route-by-tab.md) | Isolate `/words` tab code and data subscriptions |
| [026](../../plans/026-cache-lexicon-content.md) | Cache parsed static lexicon content |
| [027](../../plans/027-server-render-course-path.md) | Keep curriculum data on the server side of RSC |
| [028](../../plans/028-scope-phoneme-session-data.md) | Bound phoneme session queries and grouping — **DONE** (2026-07-03) |
| [029](../../plans/029-narrow-query-projections.md) | Remove remaining broad Supabase projections |

Recommended order: 024, 025, 026, 027, 028, 029. Plans 026–029 are
independent and can be parallelized after the two client-bundle plans.

## Performance rules

### Global application shell

- A global trigger may be eager; the feature implementation it opens should be
  dynamically imported.
- Closed panels and modals must not mount data subscriptions, IndexedDB reads,
  timers, media resources, or large component trees.
- Once-opened state may remain mounted when preserving user work is necessary,
  but the default route load must remain deferred.

### Client boundaries

- Static datasets such as curricula belong in Server Components.
- Passing a static object from a Server Component to a Client Component still
  serializes it through RSC; moving only the import does not solve payload cost.
- Client Components should receive IDs, compact view models, and interactive
  state—not complete catalogs.
- Route tabs should mount only the active runtime. Hiding inactive tabs with
  CSS is not a performance boundary.

### Data access

- Supabase queries use explicit column projections.
- Joined relations also use explicit nested projections such as
  `entries(id, word, ...)`; do not use relation wildcards like `entries(*)`.
- `select("*", { count: "exact", head: true })` is allowed for count-only
  queries.
- Unbounded catalog reads require a documented reason.
- Build lookup maps in one pass. Avoid `items.map(item => all.filter(...))`
  when one grouped pass provides the same result.
- Batch independent queries with `Promise.all`; avoid sequential query loops.

### Static content

- Build-time JSON read through `fs` should be parsed once per server process.
- Cached canonical arrays must not be exposed to in-place shuffling or mutation.
- If content becomes runtime-editable, add explicit invalidation rather than an
  undocumented TTL.
- The codebase does not currently use Next.js Cache Components or related
  invalidation primitives directly (`"use cache"`, `unstable_cache`,
  `cacheTag`, `cacheLife`, `revalidateTag`, `revalidatePath`). Cache review
  should focus on custom cache layers and route behavior instead.
- CEFR offline packs (`public/offline-packs/`, 1.1–3.8 MB per level) are
  excluded from the Serwist precache and only enter CacheStorage on an
  explicit download. The hub loads the pack UI, pack manager and Essential
  Words session as deferred chunks, so `/offline` keeps its Plan 056 payload
  until the learner opens them. See `offline-sync.md` for the version policy.
- The lexicon cache is enforced by tests: a complete `/words` read model reads
  `index.json` and each category JSON once, and subsequent calls perform no
  additional file or directory reads. Preview shuffling operates on a copy of
  the cached canonical word order.

## Measurement procedure

Before and after a performance change:

1. Use the project-required Node.js 24.x runtime.
2. Start from a clean `.next` directory when comparing build artifacts.
3. Run:

   ```bash
   pnpm type-check
   pnpm lint
   pnpm test
   pnpm lint:design-tokens
   pnpm build
   ```

4. Record route client chunks from
   `.next/server/app/**/page_client-reference-manifest.js`.
5. Sum unique referenced files under `.next/static/chunks/`; record raw and
   gzip totals.
6. Record relevant `.rsc` and `.html` output sizes for statically generated
   routes.
7. For query changes, record row count, selected columns, and query count. Do
   not claim latency gains without a representative environment.

## Performance acceptance criteria

A performance PR should satisfy all applicable checks:

- No behavior regression in focused tests.
- Full verification suite passes.
- The targeted chunk, payload, query count, or algorithmic cost decreases.
- No unrelated route regresses materially. Treat a gzip increase above 5 KB on
  a shared entry as requiring explanation.
- The before/after measurement is appended below.

## Measurement history

| Date | Commit | Change | Result |
|---|---|---|---|
| 2026-06-21 | `4c35b5e` | Initial audit baseline | Root shared entry 196.6 KB gzip; `/` 299.5 KB; `/words` 225.8 KB; `/courses` 207.6 KB |
| 2026-06-21 | `26c3d55` | Defer global AI Coach and Quick Add via `next/dynamic` + conditional mount | Root shared entry 148.3 KB gzip (−48.3 KB); `/` 254.4 KB gzip (−45.1 KB); AI Coach / Quick Add excluded from initial `/` route set |
| 2026-06-21 | `a3dd495` | Split `/words` by tab runtime and defer inactive tab chunks | `/words` 153.0 KB gzip (−72.8 KB); inactive My Words / Decks runtimes now load only when their tab is active |
| 2026-06-21 | `WORKTREE` | Server-render `/courses` level selection and keep the full curriculum out of client references | `/courses` now renders per-request because `?level=` is server-selected; the generated `/courses` client manifest no longer contains `lib/courses/curriculum`; build verification passed on Node 26.3.1 (project target remains Node 24.x) |
| 2026-06-21 | local | Cache parsed lexicon datasets in the server process | Cold `/words` model reads each of the 10 JSON files once; warm reads perform no additional filesystem reads; no latency percentage claimed |
| 2026-06-21 | local | Bound phoneme session datasets to target + confusable sounds | Sound practice no longer calls `getAllWords()`; session words are fetched with `sound_id IN (...)` and grouped in one pass; review/daily plans batch multi-sound minimal-pair reads and assemble per-sound datasets without nested `allSounds.map(...allWords.filter(...))` |
| 2026-07-23 | `83b0e7d0` | Exclude lazy CMUdict from `allChunksGzipKB` | Eager total 1,275 KB gzip (82 chunks); deferred dictionary 939 KB gzip |
| 2026-08-18 | `eb033385` | Re-baseline after feature growth (essential-words, search, curriculum) | Eager total 1,531 KB gzip (111 chunks); root main still 168 KB gzip; CMUdict still deferred |
| 2026-09-14 | `HEAD` | Plan 001: Medición de carga inicial por ruta vs total publicado | CI bloquea en `maxRouteGzipKB` (558.4 KB / límite 575 KB) y `rootMainGzipKB` (165.9 KB / límite 168 KB); total publicado (2,388.8 KB) se registra como diagnóstico. |
| 2026-09-14 | `HEAD` | Plan 003 y 004: Defer daily composer y reducción de /practice/review | `/daily` mantiene compositor diferido (279.7 KB). `/practice/review` reduce de 558.4 KB (21 chunks) a 149.6 KB (10 chunks, −73.2% de peso). Máxima ruta global baja a 360.9 KB (`assessment/pronunciation`). |
| 2026-09-28 | `WORKTREE` | Plan 056, ejecución parcial | Next 16.3.5 / Webpack: root main 170.1 KB gzip, ruta inicial máxima 549.9 KB, total publicado 1,495.2 KB gzip (143 chunks; bundle gate passed). Captura raw antes→después: `/offline` 2,379.9→670.0 KB (34→15 URLs JS); `/daily` 2,068.4→2,719.0 KB (33→55); `/tracking` 1,859.8→1,401.8 KB (36→39); `/practice` 1,925.7→1,997.4 KB (31→47). Superseded by the like-for-like row below. |
| 2026-09-28 | `WORKTREE` | Plan 056, comparación homogénea | Turbopack en ambos lados, mismo `.env.local`, mismo spec `plan056-route-payloads`. Baseline `26c05b4f` (`F8yaFxIcFO9SIQzqVYqki`) → árbol actual (`TUwMh7qD1OqvKXr9yNc_S`), KB raw: `/offline` 2,379.9→674.2 (−71.7%, 34→14 URLs); `/daily` 3,079.0→3,052.5 (−0.9%, 43→42); `/tracking` 2,279.2→1,768.1 (−22.4%, 41→32); `/practice` 2,345.1→2,345.2 (0%, 36→36). |

#### Plan 056 — atribución del aumento de `/daily` (2026-09-28)

El aumento de +650.6 KB en `/daily` era un artefacto de medición, no una regresión. El build baseline `KQbMr1ZvWaZmt3tdUajL7` se compiló en la worktree de Plan 055 sin `.env.local`: ningún chunk cliente contenía el host de Supabase (0 archivos; el build actual lo contiene en 5). Sin `NEXT_PUBLIC_SUPABASE_*` inlined, `/daily` renderizaba la rama "Supabase no configurado" y descargaba menos JavaScript. `/offline` no depende de esas variables, por eso su baseline coincide exactamente (2,379.9 KB) en ambas capturas. Recompilado el mismo commit con `.env.local`, `/daily` mide 3,079.0 KB y el árbol actual 3,052.5 KB: sin regresión.

Pendiente fuera de alcance: en `/daily` pesan un chunk de polyfills Node (`EventEmitter`, `get-intrinsic`; 405.7 KB raw, exclusivo de `/daily`) y Zod en cliente (382.1 KB raw, compartido con `/tracking` y `/practice`). Son candidatos para un plan posterior.

Regla para futuras mediciones: baseline y candidato deben compilarse con el mismo bundler y el mismo `.env.local`; verificar con una búsqueda del host de Supabase en `.next/static/chunks` antes de comparar.

#### Plan 056 — verificación parcial (2026-09-28)

La captura usa Node 24.18.0 y suma cuerpos de URLs JavaScript HTTP 200 únicos observados por Playwright; son KB raw, no gzip ni transferencia por red. Compara el baseline Plan 055 `KQbMr1ZvWaZmt3tdUajL7` con el build Webpack `7Y2wxUUMacGaVXNLq9H6N`; al cambiar el bundler, estos deltas son observacionales, no causales. El árbol también conserva cambios previos del usuario en [`NewChunkInvitation.tsx`](../../components/daily/NewChunkInvitation.tsx). `/daily` queda 650.6 KB raw (+31.5%) sobre el baseline y todavía requiere atribución.

Next 16 usa Turbopack por defecto y ese build no ejecutó el plugin de Webpack de `@serwist/next`; el artefacto `public/sw.js` seguía obsoleto y el navegador no podía controlarse. `pnpm build` ahora compila producción con `next build --webpack`. El build resultante genera `/sw.js` con la política runtime vigente. `pnpm analyze:bundle:check` pasa: root main 170.1 KB gzip y ruta máxima 549.9 KB, ambos bajo sus umbrales; el inventario publicado es 1,495.2 KB gzip y 143 chunks, bajo 2,805 KB.

La aceptación Playwright de producción pasó: el worker queda activo y controla la página; `/search/content-index.json` se guarda en `public-search-index` y responde sin red; una recarga offline de `/daily?step=review` conserva la URL y muestra `Tu sesión de hoy`; al reconectar la ruta vuelve a responder. Esta prueba usa la sesión anónima creada por el setup de Playwright. `pnpm test:perf:cold-nav` pasó 5 pruebas, incluida la aceptación offline y la captura por ruta. Los errores de stream cerrado de Next aparecieron como advertencias sin fallar las pruebas.

El índice nuevo ocupa 314,913 bytes como JSON versionado frente a 349,688 bytes del módulo TS retirado; se solicita solo al abrir búsqueda, y Fuse solo tras una consulta no vacía. El gate de bundle pasó; el aumento de `/daily` quedó atribuido a la medición (ver sección anterior), por lo que Plan 056 queda completo.
