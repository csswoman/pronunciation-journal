# Plan 039: Split Words interaction chunks beyond tab runtimes

> **Executor instructions**: Follow the steps and stop on STOP conditions.
> Update `plans/README.md` when complete.
>
> **Drift check (run first)**:
> `git diff --stat f47f5a13..HEAD -- app/(authenticated)/words components/words components/vocabulary hooks/useWords.ts hooks/useDeckData.ts`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `f47f5a13`, 2026-07-05

## Why this matters

`/words` now loads tab runtimes dynamically and defers several modals, but the
Decks and My Words runtimes still contain large feature groups: study session,
deck management, AI suggestions, bulk actions, and image/word-bank flows.
These are user-triggered interactions and should not inflate the first open of
a tab. Vercel rules: `bundle-dynamic-imports`, `bundle-conditional`, and
`bundle-preload`.

## Current state

- `components/words/WordsClient.tsx` dynamically loads tab runtimes.
- `components/words/tabs/MyWordsTabRuntime.tsx` dynamically loads some modals.
- `components/words/tabs/DecksTabRuntime.tsx` dynamically loads deck modals.
- Production build after commit `f47f5a13` created `/words` async chunks
  including a large group around 15.8 + 34.5 + 32.7 KB gzip.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Tests | `pnpm test -- components/words components/vocabulary hooks/useWords.ts hooks/useDeckData.ts` | all pass |
| Lint | `pnpm lint` | exit 0 |
| Build | `pnpm exec next build` | exit 0 |
| Bundle summary | `pnpm analyze:bundle` | writes summary |

## Scope

**In scope**:
- `components/words/tabs/*Runtime.tsx`
- `components/vocabulary/decks/*`
- `components/vocabulary/words/*`
- Optional focused tests for dynamic interaction mounting

**Out of scope**:
- Changing `/words` URL structure
- Pagination/virtualization
- Supabase schema/API changes
- Visual redesign

## Git workflow

- Branch: `codex/039-split-words-interaction-chunks`
- Commit: `perf(words): defer heavy tab interactions`

## Steps

### Step 1: Map the current async chunks

After a build, read `.next/server/app/(authenticated)/words/page/react-loadable-manifest.json`
and gzip the referenced chunks. Identify which chunk corresponds to:

- Lexicon tab
- My Words tab
- Decks tab
- Quick add / deck create modals
- Study modal
- Manage drawer / AI suggest

**Verify**: produce a short chunk map before editing.

### Step 2: Split deck study from deck management

Ensure `StudyModal`, `StudyModalWordBank`, `ManageDrawer`, and AI suggest code
do not share one large eager chunk for the Decks tab. Use separate dynamic
imports at the interaction boundary and avoid barrel imports that pull sibling
features together.

**Verify**: typecheck passes and chunk map shows separate files.

### Step 3: Split My Words bulk workflows

Keep the default My Words list runtime lean. Defer:

- `CreateDeckFromWordsModal`
- `AddToExistingDeckModal`
- any deck summary query code used only by those modals

Load existing deck summaries only when the add-to-existing modal opens.

**Verify**: tests cover bulk create/add behavior.

### Step 4: Add optional hover/focus preloading

For buttons that open deferred heavy interactions, consider calling the dynamic
component preload mechanism or an explicit `import()` on hover/focus. Keep this
small and do not preload all interactions on tab mount.

**Verify**: no behavior change; manual smoke test if no automated coverage.

### Step 5: Re-measure `/words`

Run build and inspect the words manifest again. Expected result: default tab
and initial tab interactions no longer share the largest study/manage chunks.

## Test plan

- Existing Words and vocabulary component tests.
- Focused tests for modal open paths if current coverage misses them.
- Manual or automated smoke for studying a deck and managing deck words.

## Done criteria

- [ ] Study, manage, AI suggest, and bulk deck workflows are isolated by interaction.
- [ ] Default `/words?tab=lexicon` does not include My Words/Decks interaction chunks.
- [ ] Opening a tab does not load closed heavy interactions.
- [ ] Typecheck, lint, focused tests, and direct build pass.

## STOP conditions

- Next/Turbopack groups dynamic imports in a way that cannot be separated
  without large component rewrites.
- Splitting breaks modal state or deck study progress.
- Existing tests cannot mock dynamic imports without significant test harness work.

## Maintenance notes

Future `/words` interactions should load on demand and avoid importing sibling
modal families through shared runtime files.

