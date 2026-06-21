# Plan 026: Cache parsed lexicon content within the server process

> **Executor instructions**: Follow the steps exactly and update the plan index
> when done.
>
> **Drift check (run first)**:
> `git diff --stat 4c35b5e..HEAD -- lib/lexicon/categories.ts app/words/page.tsx app/api/lexicon`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `4c35b5e`, 2026-06-21

## Why this matters

The lexicon consists of 10 JSON files totaling about 313.1 KB. Server rendering
repeatedly performs synchronous directory scans, file reads, and JSON parsing:
`getCategories()` reads every category, `app/words/page.tsx` reads them again
for IDs and preview tags, and API/detail routes repeat the same work. The data
is immutable for the life of a deployed build and should be parsed once per
server process.

## Current state

- `lib/lexicon/categories.ts:8-33` reads `index.json`, scans the directory, and
  calls `getCategoryWords` for each category.
- `categories.ts:36-40` synchronously reads and parses a category file on every
  call.
- `categories.ts:43-49` calls `getCategoryWords` again and shuffles the returned
  array in place.
- `app/words/page.tsx:13-16` calls `getCategories` then reads every category
  again to build ID lists; `:34-47` calls `getPreviewTags` for each category.
- This is server-only code because it imports `fs` and `path`.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Tests | `pnpm test -- lib/lexicon` | all pass |
| Typecheck | `pnpm type-check` | exit 0 |
| Build | `pnpm build` | exit 0 |

## Scope

**In scope**:

- `lib/lexicon/categories.ts`
- `lib/lexicon/__tests__/categories.test.ts` (create)
- `app/words/page.tsx` only to consume a new combined read model
- `docs/architecture/performance.md`

**Out of scope**:

- Changing JSON file format or moving content to Supabase
- Client-side fetching of lexicon JSON
- Content changes
- Persistent/distributed caches

## Git workflow

- Branch: `codex/026-cache-lexicon-content`
- Commit: `perf(lexicon): cache parsed static datasets`

## Steps

### Step 1: Add read-count characterization tests

Mock or spy on `fs.readFileSync` and `fs.readdirSync`. Test that repeated calls
to category and word readers do not repeat filesystem work after warm-up.
Also test missing categories, returned word order, category totals, and that
preview generation never mutates the cached canonical array.

**Verify**: `pnpm test -- lib/lexicon/__tests__/categories.test.ts`.

### Step 2: Introduce module-scoped immutable caches

Add typed module-level caches for:

- parsed index metadata;
- category id list;
- words by category;
- computed category metadata.

`getCategoryWords` must not expose a mutable cached array that callers can
shuffle or modify. Return a readonly view where compatible, or a shallow copy
at public boundaries. Keep missing-file behavior as `[]`.

Do not add runtime TTLs: deployed static files do not change during a process.

**Verify**: focused tests and `pnpm type-check` exit 0.

### Step 3: Add a combined server read model

Export one function that returns the data needed by `/words`: category metadata,
word IDs, and preview tags from the already cached content. Update
`app/words/page.tsx` to use it rather than making three passes through the
public helpers.

Keep domain/business transformations in `lib/lexicon`, not in the page.

**Verify**: tests assert one parse per JSON file for a complete read model.

### Step 4: Full verification and measurement

Run the full verification suite and `pnpm build`. Record the qualitative
improvement and test-enforced read count in the performance document. Do not
claim a latency percentage without a runtime benchmark.

## Test plan

- Cold cache reads files once.
- Warm cache performs zero additional reads.
- Preview generation does not mutate cached words.
- Missing category returns `[]`.
- Combined read model matches the previous public shape.

## Done criteria

- [ ] Repeated lexicon calls reuse parsed content.
- [ ] `/words` builds its server props in one cached pass.
- [ ] Cached arrays cannot be mutated by preview shuffling.
- [ ] Focused and full tests pass.
- [ ] Production build passes.

## STOP conditions

- Tests depend on hot-reloading content changes within one Node process.
- A consumer imports this module into a Client Component.
- Returning copies causes unacceptable API breakage requiring broad refactors.

## Maintenance notes

If lexicon content becomes runtime-editable, replace this process cache with an
explicit invalidation/version strategy. Do not silently add a TTL.
