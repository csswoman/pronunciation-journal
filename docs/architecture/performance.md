# Performance architecture and optimization baseline

This document records the project's performance boundaries, measurement
baseline, and architectural rules. Implementation work is tracked separately
in [`plans/README.md`](../../plans/README.md).

Last measured: 2026-07-03 at commit `51515e0` (post roadmap 032 Fase 2).

## Baseline

Environment:

- Next.js 16.2.9 with Turbopack production build
- React 19.2.7
- Project runtime requirement: Node.js 24.x

Verification baseline:

- Production compilation: 11.2 seconds
- TypeScript phase: 16.5 seconds
- Static generation: 91 pages in about 1.6 seconds
- Tests: 151 files, 925 tests, all passing
- Bundle analysis: `pnpm analyze:bundle` → `bundle-summary.json` (CI enforces `pnpm analyze:bundle:check`)

### Client JavaScript (Turbopack build, 2026-07-03)

Metrics from `scripts/analyze-bundle.mjs` (gzip via Node zlib, same machine as build):

| Metric | Raw | Gzip |
|---|---:|---:|
| Root main entry (`build-manifest.json` root + polyfills) | 556 KB | 168 KB |
| All `static/chunks/*.js` (64 files) | 6,960 KB | 1,868 KB |

CI budgets (`scripts/bundle-budget.json`, +10% tolerance):

| Metric | Budget gzip |
|---|---:|
| `rootMainGzipKB` | 168 KB |
| `allChunksGzipKB` | 1,868 KB |

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
