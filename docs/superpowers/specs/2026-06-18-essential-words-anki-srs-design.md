# Essential Words — Anki-style SRS session (design)

**Date:** 2026-06-18
**Status:** Approved design, pending implementation plan
**Scope:** Rename `Core1000Session` → `EssentialWords`, plus redesign the
practice session to behave like Anki: same-session relapse queue, live
new/learning/review counters, "learn more" past the daily cap, and archiving
mastered words.

## Background

The Core 1000 practice flow already has a working SM-2 SRS. Confirmed by live
inspection of IndexedDB (`pronunciation-journal` → `srsData`): grading a word
persists correctly (e.g. `c1k:the` → `interval: 1`, `nextReview` tomorrow).

**There is no persistence bug.** The user's complaint ("always starts from the
first word") has two real causes that are about queue model + UX, not storage:

1. Failed words (pronunciation accuracy below the SM-2 pass threshold, i.e.
   `grade < 3`) are scheduled for *tomorrow* (`interval = 1`), not re-shown in
   the current session. High-frequency low-rank words ("the", "be"…) that are
   hard to score keep returning to the front of tomorrow's queue, so they
   dominate the start of every session with no sense of progress.
2. The HUD only shows `position / total` — no breakdown of what is new vs.
   review vs. relapsed, so the session feels like it never advances.

## Decisions (from brainstorming)

- **On failure:** re-show the word *within the same session* (Anki learning
  queue) until correct.
- **Relapse reappears** ~3 turns later (not immediately); SM-2 state for the
  lapse persists to Dexie when the word is finally answered correctly, or on
  session close (flush of pending lapses). Not on every failed attempt.
- **HUD:** Anki-style live breakdown — `New · Learning · Review` remaining.
- **"Keep practicing" past the daily cap:** add another batch of N *new* words
  (next by rank), above the daily quota. Surfaced as an opt-in CTA.
- **"I already know this":** archive the word — removed from all future
  sessions (new and review), reversible (un-archive later). Counts as learned.
- **Approach A:** in-memory learning queue layered over the existing pure
  queue builder. No Dexie schema migration. Heavy logic stays in pure,
  testable functions; the hook orchestrates state + I/O only.

## Non-goals / explicit constraints

- Do **not** rename `lib/core-1000/`, the `c1k:` `wordId` prefix, or any stored
  `wordId`. Those are persisted data identity — renaming them would orphan
  existing user progress. The rename is presentation/hook layer only.
- Do **not** add per-attempt Dexie writes for lapses (user chose "persist at
  end"). The learning queue is session state.
- Do **not** model full Anki learning steps in Dexie (YAGNI for a 10-word/day
  flow). A single `archived` flag is the only data-model change.
- Must not break offline mode. All reads/writes go through Dexie helpers in
  `lib/db` / `lib/core-1000`.

## Data model

Extend `SRSData` (`lib/types`) with optional fields — **no Dexie migration**
needed (field is unindexed; old rows read as `undefined`):

```ts
archived?: boolean
archivedAt?: string // ISO
```

New `lib/db` helpers:

- `archiveCore1000Word(word: string): Promise<void>` — set `archived: true`,
  `archivedAt`, via `put` (upsert; creates the SRS row if the word was never
  graded).
- `unarchiveCore1000Word(word: string): Promise<void>` — clear the flag.
- `getCore1000SrsEntries()` — **filter out** `archived === true`.
  (A separate listing of archived words for an un-archive UI is out of scope
  for this spec; the helper exists so a future surface can call it.)

## Queue engine (`lib/core-1000/queue.ts`, pure)

Replace `isNew: boolean` on `Core1000QueueItem` with:

```ts
kind: 'new' | 'review' | 'learning'
```

`buildSessionQueue`:
- Base queue = due reviews (by rank) then new words up to remaining quota (by
  rank), as today.
- Exclude any `wordId` with `archived === true` from reviews **and** from the
  `seen` set (so archived words never resurface as "new").

New pure helpers (extracted so the relapse logic is testable without React):

- `reinsertLearning(queue, index, item)` — returns a new queue with `item`
  (as `kind: 'learning'`) inserted at `index + 3`, or appended if the queue is
  shorter than that.
- `deriveCounts(queue, index)` — returns `{ newRemaining, learningRemaining,
  reviewRemaining }` counting items at/after `index` by `kind`.
- `appendNewBatch(queue, words, seen, n = NEW_CARDS_PER_DAY)` — appends the
  next `n` new words by rank, skipping anything already in queue or seen.

## Hook (`hooks/useEssentialWordsSession.ts`)

Renamed from `useCore1000Session`. Orchestrates state + I/O only.

State: mutable `queue` + `index` (queue mutates on relapse), plus a
`pendingLapses` ref (`Map<wordId, quality>`).

`submitGrade(quality, extras)`:
- `quality >= 3` (pass): persist SM-2 via `gradeCore1000Word`; remove item;
  if it was `learning`, drop it from `pendingLapses`; advance.
- `quality < 3` (fail): do **not** persist yet; `reinsertLearning` at
  `index + 3` with `kind: 'learning'`; record `pendingLapses.set(wordId,
  quality)`; advance.
- New-word introduction tracking (`recordCore1000Introduction`) unchanged.

`finishSession()`: flush every entry still in `pendingLapses` to Dexie via
`gradeCore1000Word` (covers "failed but never retried today"), then record the
activity session + flush outbox as today.

`learnMore()`: `appendNewBatch`, raise effective quota, return to active phase.

`archiveWord(word)`: call `archiveCore1000Word`, remove item from live queue,
advance.

Returns, in addition to today's surface: `counts: { newRemaining,
learningRemaining, reviewRemaining }`, `learnMore`, `archiveWord`.

## UI / components

Rename, file by file (presentation layer only):
- `components/practice/core-1000/Core1000Session.tsx` → `EssentialWordsSession.tsx`
- `hooks/useCore1000Session.ts` → `useEssentialWordsSession.ts`
- Update imports in: `app/practice/core-1000/page.tsx`,
  `DeckProgressHeader.tsx`, `SessionDone.tsx`, and the test file.

Components:

1. **`SessionProgressHud`** (new) — replaces `position / queueLength`. Three
   live numbers `New · Learning · Review`. Accent color only when
   `learningRemaining > 0`; rest neutral (per accent-color rule). One
   responsibility, < 60 lines.
2. **`WordStudyCard` / `SpeakReviewCard`** — add a discreet **"Ya la sé"**
   button → `archiveWord`. Small, neutral, does not compete with the CTA.
3. **`SessionDone`** — add an opt-in CTA **"Aprender 10 nuevas más"** →
   `learnMore()`, labeled as optional/extra; keep the existing "Continuar"
   reload action.

All components: ≤250 lines, design tokens only, no inline styles, single
responsibility.

## Testing (Vitest)

Pure engine carries the bulk of the tests (`lib/core-1000/__tests__/`):

**`queue.test.ts`** (extend existing):
- Due reviews before new, both by rank.
- `archived` items excluded from review and from `seen` (never reappear as new).
- `appendNewBatch` appends exactly the next N by rank, no duplicates.
- Each item carries the correct `kind`.

**`relapse.test.ts`** (new):
- Fail re-inserts at `index + 3`.
- Short queue → appended at end.
- Passing a `learning` item removes it (no re-insert).
- `deriveCounts` for mixed new/learning/review cases.

**Hook** — light integration test with `fake-indexeddb` (already used in repo):
- `finishSession` flushes pending lapses to Dexie.
- `archiveWord` persists `archived: true`.

No heavy UI tests — components are presentational. TDD for the pure engine
(tests before implementation).

## Files touched (summary)

- `lib/types` — `SRSData.archived?` / `archivedAt?`
- `lib/db/index.ts` — `archiveCore1000Word`, `unarchiveCore1000Word`,
  filter in `getCore1000SrsEntries`
- `lib/core-1000/queue.ts` — `kind`, `reinsertLearning`, `deriveCounts`,
  `appendNewBatch`
- `hooks/useEssentialWordsSession.ts` (renamed) — relapse, learnMore, archive,
  lapse flush
- `components/practice/core-1000/EssentialWordsSession.tsx` (renamed)
- `components/practice/core-1000/SessionProgressHud.tsx` (new)
- `WordStudyCard.tsx`, `SpeakReviewCard.tsx`, `SessionDone.tsx`,
  `DeckProgressHeader.tsx` — wiring + archive/learn-more CTAs
- `app/practice/core-1000/page.tsx` — import update
- Tests: `queue.test.ts` (extend), `relapse.test.ts` (new), hook integration
