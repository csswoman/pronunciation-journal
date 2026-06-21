# Plan 025: Load each Words area only when its tab is active

> **Executor instructions**: Execute every step and verification in order.
> Stop on any listed STOP condition. Update `plans/README.md` when complete.
>
> **Drift check (run first)**:
> `git diff --stat 4c35b5e..HEAD -- app/words/page.tsx components/words/WordsClient.tsx hooks/useWords.ts hooks/useDeckData.ts components/vocabulary`

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/024-defer-global-client-features.md`
- **Category**: perf
- **Planned at**: commit `4c35b5e`, 2026-06-21

## Why this matters

`/words` presents three independent areas—Lexicon, My Words, and Decks—but one
large Client Component statically imports and initializes all of them. Opening
the default Lexicon tab currently triggers the complete word-bank query,
realtime subscription, polling fallback, deck queries, counts, and all modal
code. The route measured 794.1 KB raw / 225.8 KB gzip of client chunks.

## Current state

- `components/words/WordsClient.tsx:13-31` imports all tab implementations,
  hooks, modals, and query functions.
- `WordsClient.tsx:65-67` calls `useWords()` unconditionally.
- `WordsClient.tsx:136-143` calls `useDeckData()` unconditionally.
- `hooks/useWords.ts:103-201` loads all words and subscribes to realtime on
  mount; `:205-281` starts a polling fallback when processing rows exist.
- `hooks/useDeckData.ts:22-38` loads decks and counts on mount.
- `app/words/page.tsx` already renders lexicon summary data on the server.
- Preserve `?tab=lexicon|my-words|decks`, existing deep links, keyboard
  shortcuts, selection flows, modals, and optimistic updates.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Tests | `pnpm test -- components/words hooks` | all pass |
| Lint | `pnpm lint` | exit 0 |
| Build | `pnpm build` | exit 0 |

## Scope

**In scope**:

- `components/words/WordsClient.tsx`
- New tab runtime components under `components/words/tabs/`
- Existing Words tests and new tests under `components/words/__tests__/`
- `hooks/useWords.ts` and `hooks/useDeckData.ts` only for an explicit `enabled`
  contract if component extraction alone cannot prevent mounting
- `docs/architecture/performance.md`

**Out of scope**:

- Database schema and Supabase RPCs
- Visual redesign of tabs/cards/modals
- Pagination or virtualization of My Words
- Changing route URLs

## Git workflow

- Branch: `codex/025-split-words-route-by-tab`
- Commit: `perf(words): isolate tab runtimes and data loading`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Characterize inactive-tab behavior

Add tests proving that with `?tab=lexicon` neither `getMyWords`,
`subscribeWordBankChanges`, `getUserDecksFull`, nor `getDeckCounts` runs.
Add corresponding tests proving each query group starts when its tab becomes
active. Model routing mocks after existing Next navigation tests in the repo.

**Verify**: focused tests initially fail for the expected unconditional loads.

### Step 2: Extract three tab runtimes

Create:

- `components/words/tabs/LexiconTabRuntime.tsx`
- `components/words/tabs/MyWordsTabRuntime.tsx`
- `components/words/tabs/DecksTabRuntime.tsx`

Keep Lexicon presentational and fed by the server props already available.
Move `useWords`, word selection, word modals, and word-specific shortcuts into
My Words. Move `useDeckData`, deck study/manage/edit/delete state, and deck
modals into Decks.

Do not duplicate shared domain logic. Existing hooks and query modules remain
the authoritative data layer.

**Verify**: `pnpm type-check` exits 0.

### Step 3: Dynamically load inactive runtime code

Use `next/dynamic` in `WordsClient.tsx` for My Words and Decks. Render exactly
one runtime for the active tab. Lexicon may remain eager because it is the
default and uses server-provided data.

Provide stable, small loading placeholders. Do not pre-render hidden runtimes
with CSS because that still executes their hooks.

**Verify**: inactive-tab tests now pass.

### Step 4: Preserve cross-feature interactions

The My Words flow can create or add to decks. Keep this behavior without
mounting the entire Decks runtime. The My Words runtime may call narrowly
scoped deck-summary queries only when the relevant modal opens. It must not
initialize `useDeckData` merely to support a closed modal.

Test:

- create deck from selected words;
- add selected words to an existing deck;
- switching tabs updates the URL without full-page navigation;
- returning to a tab has a documented state policy. Prefer preserving state
  during the current route visit; if that materially defeats chunk isolation,
  reset transient modal/selection state and document it.

**Verify**: `pnpm test -- components/words hooks/useWords` → all pass.

### Step 5: Measure and document

Build production and record the `/words` client gzip total. Confirm the initial
Lexicon load does not include My Words and Decks runtime chunks.

**Verify**: `/words` initial gzip is lower than 225.8 KB and the result is
recorded in `docs/architecture/performance.md`.

### Step 6: Full gate

Run `pnpm type-check`, `pnpm lint`, `pnpm test`,
`pnpm lint:design-tokens`, and `pnpm build`. All exit 0.

## Test plan

- Query/subscription non-execution for inactive tabs.
- Query execution for active tabs.
- URL tab synchronization.
- My Words optimistic add/delete/retry remains intact.
- Deck create/edit/delete/study/manage flows remain intact.
- No test should rely only on component snapshots.

## Done criteria

- [ ] Only the active tab's runtime mounts.
- [ ] Lexicon causes no word-bank realtime/polling or deck-count queries.
- [ ] My Words and Decks live in separate async chunks.
- [ ] Existing cross-tab workflows still function.
- [ ] `/words` initial gzip is below 225.8 KB.
- [ ] Full verification suite exits 0.

## STOP conditions

- Current product behavior requires hidden tabs to remain live and subscribed.
- A shared modal cannot be isolated without changing its public contract across
  more than five unrelated files.
- Dynamic imports introduce hydration errors or break URL-driven initial tabs.

## Maintenance notes

Future tabs must own their own data subscriptions and modal state. A hidden tab
must not remain mounted merely for convenience.
