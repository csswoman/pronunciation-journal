# Known Words Triage (swipe) — Design

## Problem

The user already knows many Essential Words (e.g. most A1/A2 vocabulary) but the
practice queue (`lib/essential-words/queue.ts`) has no fast way to bulk-exclude
words the user already knows. Today, "I already know this" can only be declared
one word at a time, mid-session, via `omitWord` in `useEssentialWordsSession`.

## Goal

A quick, mobile-first "Tinder-style" swipe screen where the user triages words
by CEFR level, before ever starting a practice session:

- **Swipe left = "I already know it"** → excluded from future exercises.
- **Swipe right = "I don't know it"** → no change; stays a normal candidate.

## Non-goals

- Not a game, not part of the scored session flow, no XP/streak impact.
- Not a replacement for `omitWord` (mid-session single-word declaration stays
  as-is).
- No new sync/outbox work — `srsData` is already a local-only Dexie table
  (confirmed: not wired into `lib/sync`), matching existing
  `masterEssentialWord`/`snoozeEssentialWord` behavior.

## Where it lives

New route: `app/(authenticated)/practice/essential-words/known/page.tsx`
(Server Component, `PageLayout` wrapper only — routes and composes, no logic,
per CLAUDE.md).

Entry point: a new card/button in `SessionReady` (or `SessionReadyHero`),
e.g. "¿Ya conoces palabras de este nivel?", linking to the new route. This is
additive to `SessionReady` — no changes to `useEssentialWordsSession`'s phase
state machine.

This flow is intentionally isolated from `useEssentialWordsSession` (217
lines, already complex): it has its own local state, its own hook, and only
touches Dexie directly through existing/small new helpers. This avoids
regression risk in the main session state machine.

## Component tree

```
// Planned structure:
// <KnownWordsTriagePage>            (Server Component, page.tsx)
//   <KnownWordsTriage>               (Client, orchestrator)
//     <TriageLevelPicker />          (choose 1+ CEFR levels; shows count per level)
//     <TriageDeck>
//       <TriageCard />               (word + meaning + IPA + audio button, draggable)
//       <TriageActionHints />        (left/right labels + tap fallback buttons)
//     <TriageSummary />              (end screen: counts + CTA back to practice)
```

Each component stays under 250 lines / single responsibility per CLAUDE.md.
`TriageCard` owns only rendering + wiring the drag gesture; `KnownWordsTriage`
owns orchestration (which card is current, counters, undo).

## Data flow

### Building the deck

`lib/essential-words/triage-deck.ts` (pure):

```ts
export function buildTriageDeck(
  words: EssentialWord[],
  srsEntries: SRSData[],
  levels: readonly CefrLevel[],
): EssentialWord[]
```

- Filters to `matchesLevels(entry, levels)` (reused from `queue.ts`).
- Excludes any word already present in `srsEntries` (has *any* SRS entry —
  same "seen" concept `buildSessionQueue` already uses), so words already
  mastered/snoozed/in-review never appear in the triage deck.
- Sorted by `rank` (same ordering convention as the rest of Essential Words).

`useKnownWordsTriage(levels)` (`hooks/useKnownWordsTriage.ts`) loads the
words JSON + `getEssentialWordsSrsEntries(userId)` (existing), builds the deck
via `buildTriageDeck`, and holds:

- `current: EssentialWord | undefined`
- `remaining: number`
- `counts: { known: number; skipped: number }`
- `markKnown(): Promise<void>`
- `skip(): void`
- `undoLast(): Promise<void>` (single-level undo)

### Marking a word "known"

Reuses the existing local-first write path:

- **~14/15 words** (not sampled for recheck): call the existing
  `masterEssentialWord(word, userId)` ([lib/db/index.ts:1171](../../../lib/db/index.ts))
  — creates (via `getOrCreateEssentialWordSrsRow`) or updates the SRS row with
  `status: 'mastered'`. Identical effect to today's "dominar" action; the
  vault UI (`SrsVaultRow`, "Dominadas" tab) already renders these with no
  changes needed.
- **~1/15 words** (deterministically sampled — see below): call a new
  `scheduleEssentialWordRecheck(word, userId)` in `lib/db/index.ts`, sibling
  to `masterEssentialWord`/`snoozeEssentialWord`, using a new pure patch
  `patchRecheck(entry, now, days = 4)` in `lib/srs/status.ts`:
  - `status` left unset (`active`), `nextReview = now + 4 days`,
    `ease = 2.5`, `interval = 4`, `repetitions = 1`.
  - This card now has a normal due date. `isDueForQueue` and
    `buildSessionQueue` require **zero changes** — in ~4 days it surfaces as
    an ordinary review item through the existing engine-router
    (recognize/cloze/etc.), and normal SM-2 grading takes over from there:
    correct → progresses toward real mastery; incorrect → normal lapse
    handling puts it back in the regular rotation. This *is* the "occasional
    recheck" safety net (chosen option B), built entirely from existing SRS
    machinery — no new sampling subsystem.

Sampling function, `lib/essential-words/triage-recheck.ts`:

```ts
export const RECHECK_SAMPLE_RATE = 1 / 15;

/** Deterministic per-word decision: same word always samples the same way. */
export function shouldSampleForRecheck(wordId: string): boolean
```

Implemented as a small string hash of `wordId` mapped to `[0, 1)`, compared
against `RECHECK_SAMPLE_RATE`. Deterministic (no `Math.random`) so it's
trivially unit-testable and idempotent if the same word is ever re-evaluated.

### Skipping a word

`skip()` performs **no write**. The word is simply advanced past in this
session; it remains a normal candidate for `buildSessionQueue`'s regular
"new word" introduction exactly as it is today. This matches the existing
principle in `queue.ts` that only a persisted SRS entry excludes a word.

### Undo

Because every word in the triage deck is guaranteed to have had **no prior
SRS entry** (that's what makes it eligible for the deck), undo is safe as a
hard delete: `db.srsData.delete(wordId)` for the last-marked word, then
decrement the counter and move the deck cursor back one card. Only a single
level of undo is needed (last action only) — this is a fast bulk-triage
tool, not an editable history.

## Gesture: `useSwipeCard`

New reusable hook, `hooks/useSwipeCard.ts` — no existing swipe-drag primitive
exists in the codebase (`SwipeCardStack` in Falsos Amigos is button/keyboard
only despite the name). Pointer Events based (works for touch and mouse in
one code path):

- Tracks horizontal drag offset + a small rotation proportional to offset
  (classic Tinder-card feel).
- Exposes the live offset so `TriageCard` can fade in "Ya la sé" / "No la sé"
  hint labels as the user drags.
- On release: if `|offset| > threshold` (or a fast-enough swipe velocity),
  fires `onSwipeLeft`/`onSwipeRight` and completes the animation off-screen;
  otherwise, snaps back to center.
- Also exposes imperative `triggerSwipe('left' | 'right')` so the existing
  tap-to-choose buttons (`TriageActionHints`) work identically for
  desktop/accessibility, keeping keyboard/pointer/touch all going through the
  same code path.

## Accessibility / desktop fallback

`TriageActionHints` always renders two tappable buttons (not swipe-only),
plus `ArrowLeft`/`ArrowRight` keyboard handling — matching the existing
convention in `SwipeCardStack.tsx`. Swiping is a progressive enhancement on
top of always-available buttons.

## Testing

- `triage-deck.test.ts` — `buildTriageDeck` filters by level and excludes
  seen words (pure, no Dexie).
- `triage-recheck.test.ts` — `shouldSampleForRecheck` is deterministic and
  lands close to 1/15 over a large sample of word ids.
- `useSwipeCard` — logic split so the threshold/direction decision is a pure
  function (`resolveSwipeDirection(offset, velocity)`) that's unit-tested
  without simulating real pointer events.
- `useKnownWordsTriage` — hook test (existing Vitest + Dexie fake-indexeddb
  pattern used elsewhere in `lib/essential-words/__tests__`) covering
  markKnown → mastered/recheck branching, skip (no write), and undo.

## Out of scope / follow-ups (not blocking this spec)

- No `mastery_provenance`-style field distinguishing "swiped known" from
  "earned mastery" for Essential Words (word-bank's lexicon has this; Essential
  Words' `SRSData` doesn't). Could be added later as an optional field if the
  recheck-sample safety net proves insufficient. Skipped now per YAGNI.
- No entry point from anywhere other than `SessionReady` (e.g. no shortcut
  from the home page) — can be added later if usage shows it's wanted there.
