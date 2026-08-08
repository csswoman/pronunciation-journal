# Essential Words — Session Bookends (Ready + Done) Design

**Date:** 2026-08-05
**Status:** Approved, pending implementation plan

## Problem

Essential Words practice has no pre-session summary screen — entering
`/practice/essential-words` goes straight from `phase: "loading"` into the
first study/speak card. There is no moment to see what the session contains
before committing to it.

The existing end-of-session screen (`SessionDone.tsx`) shows a single
summary line and lacks the richer structure the user wants: a 3-stat block,
a list of words that tripped the learner up, and a preview of tomorrow's
load.

Two reference mockups define the target:

- **Start screen** ("Hoy te tocan 24 palabras"): headline + time estimate,
  a 3-column stat row (Nuevas / Repasos / En el baúl), a one-line structure
  note, and a primary "Empezar" CTA.
- **End screen** ("Sesión terminada"): headline + time/count subtitle, a
  3-column stat row (Aprendidas hoy / Repasadas / Sin fallos), a "these
  tripped you up — back tomorrow" chip list, a "tomorrow" preview strip, and
  a primary "Listo" CTA.

## Scope

In scope:
- New pre-session `ready` phase and `SessionReady` screen.
- Redesigned `SessionDone` internals (same external props contract).
- A shared `StatBlock` component for the two 3-column stat rows.
- Hook changes needed to feed both screens (vault count, struggling-word
  list, session begin gate).

Out of scope (explicitly deferred):
- "Cambiar cuántas palabras nuevas por día" — no backing user preference
  exists yet (`NEW_CARDS_PER_DAY` is a fixed constant). Left out of this
  iteration; will need its own design (persistence + UI) later.
- Any change to grading, FSRS scheduling, or the session-plan engine.
- Precise "tomorrow" forecasting via real FSRS due-dates — the preview uses
  an approximation (see below), not a scheduler query.

## Design

### 1. New phase: `ready`

`EssentialWordsPhase` (`lib/essential-words/session-model.ts`) gains
`"ready"`, inserted between `"loading"` and `"study"/"speak"`:

```
"loading" | "ready" | "study" | "speak" | "done" | "empty" | "error"
```

`bootstrap()` in `useEssentialWordsSession` computes the plan exactly as it
does today (including the compat-mode <3-word fallback), but instead of
setting `phase` to the first step's phase, it sets `phase: "ready"` whenever
a plan/compat queue was produced. `phase: "empty"` / `"error"` are
unaffected — those short-circuit before `ready` as they do today.

A new `beginSession()` action transitions `ready → study/speak` using
already-held `currentStep`/`planState` (or `compatQueue`/`compatIndex` in
compat mode) — no recomputation, no new I/O. This is a pure UI gate in
front of state that already exists, so offline mode and the plan engine are
untouched.

### 2. `SessionReady.tsx`

```
// Planned structure:
// <SessionReady>
//   <ReadyHeadline />     — "Hoy te tocan N palabras" + "~M minutos"
//   <StatBlock />         — Nuevas · Repasos · En el baúl
//   <StructureNote />     — "X bloques de palabras nuevas, más los repasos y una ronda final"
//   <Button onClick={beginSession}>Empezar</Button>
// </SessionReady>
```

Data sources — all derived from state the hook already computes after
`bootstrap()`, no new async calls except the vault count (below):

| Value | Source |
| - | - |
| N palabras | `counts.newRemaining + counts.reviewRemaining` |
| ~M minutos | `estimateDurationMs()` (`lib/essential-words/session-plan-time-ceiling.ts`) applied to the already-truncated plan's expose/exercise steps |
| Nuevas | `counts.newRemaining` |
| Repasos | `counts.reviewRemaining` |
| En el baúl | count of this user's essential-words entries where `isVaultEntry` (`lib/srs/vault.ts`) is true — i.e. `snoozed` or `mastered` |
| Bloques (X) | `Math.ceil(counts.newRemaining / 3)`, computed inline in the component — mirrors the plan engine's 3-word block size, not a new constant |

If `counts.newRemaining === 0`, the structure note is omitted or rephrased
(no "bloques de palabras nuevas" to describe) — implementation detail for
the plan phase.

Compat mode (< 3 filtered words) also stops at `ready` before its first
card, showing the same screen with `counts` as compat mode already derives
them (`deriveCounts`).

"Cambiar cuántas palabras nuevas por día" is **not** included this
iteration (see Scope).

### 3. `StatBlock.tsx` (shared)

```
// Planned structure:
// <StatBlock>
//   <StatColumn × n />   — big number + muted label
// </StatBlock>
```

Generic 3(+)-column stat row: `{ label: string; value: number }[]` in,
styled per the mockups (larger type than the persistent in-session
`SessionStatsCard`, since this is a bookend moment, not always-on chrome).
Extracted from the `StatColumn` already defined inside
`SessionStatsCard.tsx` — that file keeps its own copy conceptually but both
should share this new component instead of duplicating the column markup.
Reused by `SessionReady` and the redesigned `SessionDone`.

Existing `SessionStatsCard` (in-session header) is untouched — different
data (`Nuevas · Aprendiendo · Repaso` remaining-in-session counts),
different visual weight, different spot in the UI.

### 4. `SessionDone.tsx` redesign

External props are unchanged (`stats`, `sessionSummary`, `wasEmpty`,
`loadFailed`, `onContinue`, `continueLoading`, `onLearnMore`) — only the
internal layout and the summary math backing it change.

- Headline/subtitle keep current copy logic (`loadFailed` /
  `wasEmpty` / success variants).
- `<StatBlock>` replaces the current single summary paragraph, showing:
  - **Aprendidas hoy** — new words successfully graduated this session
    (existing `stats.newToday` delta, or `sessionSummary`-derived count of
    new-word steps passed).
  - **Repasadas** — review steps practiced (`sessionSummary.practiced`
    minus new-word steps, or a new counter).
  - **Sin fallos** — words practiced this session with zero failed
    attempts (i.e. **not** present in the struggling-words set below).
- **"Estas te costaron — vuelven mañana"** — chip list of `strugglingWords`
  (see hook changes). Omitted when the list is empty.
- **"Mañana: X repasos y Y palabras nuevas"** — approximate preview:
  - `X` = `strugglingWords.length + stats.dueCount` (today's unresolved
    lapses, which FSRS will resurface soon, plus whatever's already due).
  - `Y` = `stats.newQuota` (fixed daily cap).
  - Framed as an estimate in copy (not a scheduler guarantee), since it
    doesn't query real FSRS due-dates.
- `wasEmpty` / `loadFailed` variants keep today's simpler copy — no
  stat block, chips, or tomorrow preview, since nothing was practiced.

### 5. Hook changes (`useEssentialWordsSession.ts`)

- `EssentialWordsPhase` gains `"ready"`; `bootstrap()` sets it instead of
  jumping to the first step's phase (both plan mode and compat mode).
- New `beginSession()` action: reads already-held `currentStep`/`planState`
  (or compat state) and sets `phase` to `study`/`speak` accordingly — mirrors
  the phase-selection logic already inlined in `bootstrap()`, factored so
  both call sites share it.
- New `strugglingWords: string[]` returned from the hook — captured from
  `pendingLapsesRef.current` keys (stripped of the `c1k:` prefix) at the
  point `finishSession` runs, before the ref is cleared by lapse flushing.
  Held in a small piece of state (e.g. alongside `sessionSummary`) since the
  ref itself is mutated/cleared asynchronously by `flushLapses`.
- New vault count for essential-words: query filtering this user's SRS
  entries to `c1k:`-prefixed word IDs where `isVaultEntry` is true (reusing
  `lib/srs/vault.ts`'s predicate, not duplicating vault logic). Exposed as
  `stats.vaulted` (extending `EssentialWordsStats`) or as a sibling value —
  implementation detail for the plan phase.

## Testing

- `SessionReady`: renders correct counts/estimate for varying
  new/review/vault mixes; `beginSession` transitions correctly in both plan
  and compat mode; omits structure note when no new words.
- `useEssentialWordsSession`: `ready` phase reached after bootstrap instead
  of first step; `beginSession()` reaches the same first step `bootstrap()`
  would have jumped to directly (behavior-preserving refactor, verifiable
  by comparing against current direct-jump tests); `strugglingWords`
  reflects unresolved lapses at session end and excludes recovered words.
- `SessionDone`: stat block values match `sessionSummary`; chip list shows
  only unresolved struggling words; empty/error variants unaffected.
- `StatBlock`: pure rendering component, snapshot/behavior tests for column
  count and value formatting.

## Non-goals / risks

- The "tomorrow" preview is an approximation, not a real schedule query —
  acceptable per user's explicit choice, but should read as an estimate in
  copy, not a promise.
- Vault count requires a new read path; keep it read-only and consistent
  with existing `lib/srs/vault.ts` semantics rather than inventing a
  parallel definition of "vaulted."
