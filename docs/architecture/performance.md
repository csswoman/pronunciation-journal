# Performance architecture and optimization baseline

This document records the project's performance boundaries, measurement
baseline, and architectural rules. Implementation work is tracked separately
in [`plans/README.md`](../../plans/README.md).

Last measured: 2026-06-21 at implementation commit `26c3d55`.

## Baseline

Environment:

- Next.js 16.2.9 with Turbopack production build
- React 19.2.7
- Project runtime requirement: Node.js 24.x
- Audit machine used Node.js 26.3.1, so build timings are diagnostic rather
  than release benchmarks

Verification baseline:

- Production compilation: 10.8 seconds
- TypeScript phase: 14.9 seconds
- Static generation: 88 pages in about 1.1 seconds
- Tests: 110 files, 735 tests, all passing
- Public assets: approximately 8.8 MB
- Lexicon JSON: 10 files, approximately 313.1 KB

### Client JavaScript

The values below sum unique route client chunks and gzip each generated file.
They are suitable for before/after comparisons in the same build environment,
not as a substitute for browser transfer traces.

| Route | Raw JS | Gzip JS |
|---|---:|---:|
| Root layout shared entry | 515.0 KB | 148.3 KB |
| `/` | 929.8 KB | 254.4 KB |
| `/words` | 794.1 KB | 225.8 KB |
| `/courses` | 713.7 KB | 207.6 KB |
| `/mini-lessons` | 961.0 KB | 261.4 KB |
| `/practice/review` | 885.3 KB | 253.2 KB |

Additional server output:

| Artifact | Size |
|---|---:|
| `/courses.rsc` | 38.9 KB |
| `/courses.html` | 49.1 KB |
| `/mini-lessons.rsc` | 40.3 KB |
| `/mini-lessons.html` | 49.5 KB |

## Current optimization backlog

The executable plans are deliberately separate from this architectural
document:

| Plan | Objective |
|---|---|
| [024](../../plans/024-defer-global-client-features.md) | Defer global AI Coach and Quick Add implementations |
| [025](../../plans/025-split-words-route-by-tab.md) | Isolate `/words` tab code and data subscriptions |
| [026](../../plans/026-cache-lexicon-content.md) | Cache parsed static lexicon content |
| [027](../../plans/027-server-render-course-path.md) | Keep curriculum data on the server side of RSC |
| [028](../../plans/028-scope-phoneme-session-data.md) | Bound phoneme session queries and grouping |
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
