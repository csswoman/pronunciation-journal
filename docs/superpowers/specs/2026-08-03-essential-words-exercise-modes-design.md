# Essential Words — Exercise Mode Variety (Phase 1)

**Date:** 2026-08-03
**Status:** Approved (design)
**Scope:** `lib/essential-words/`, `components/practice/essential-words/`

## Problem

Every review item in the essential-words session resolves to the same single
interaction. `lib/essential-words/session-model.ts:14` reduces the whole session
to one line:

```ts
return item.kind === "new" ? "study" : "speak";
```

Three consequences:

1. **One exercise mode.** A word on its 2nd review and a word on its 20th get an
   identical card: read `example_sentence`, hear the model, record, get scored.
2. **One fixed sentence per word.** `example_sentence` is a single string, so
   review #12 replays the sentence from review #1. The learner memorizes the
   sentence rather than the word, and the accuracy score stops measuring recall.
3. **`learning` is invisible.** The queue distinguishes `new | review | learning`
   (`queue.ts:10`), but the ternary collapses `learning` into `review`. The
   intermediate stage exists in the data and is never used.

By contrast the phoneme domain selects among ~10 generators and gates ABX by
CEFR. Essential-words has no generator layer at all — that is the actual gap.

## Non-goals (deferred to Phase 2)

Multiple sentences per word. That is what addresses "always the same sentence",
and it requires new content (Gemini generation or a manual seed). Phase 1 does
not block it: once more sentences exist, the modes below consume them with no
redesign.

**Known limitation:** Phase 1 reduces monotony of *action*, not of *content*. At
`repetitions >= 6` the learner returns to `speak_sentence` with the same
sentence — less often, but it returns.

## Approach

Add a pure mode-selection layer, mirroring the pattern that already works in
`lib/phoneme-practice/`: domain logic in `lib/`, UI renders what it is handed.

Rejected alternatives:

- **Branch inside `SpeakReviewCard`** — the component is already 292 lines with
  a single clear responsibility (record + score). Adding four modes pushes it
  well past the 250-line rule and mixes domains.
- **Only split `learning` from `review`** — does not address the core complaint;
  every review would still be record-and-score.

## Architecture

New module: `lib/essential-words/exercise-modes.ts`

```ts
export type EssentialWordMode =
  | 'recognize_translation'   // translation -> word
  | 'recognize_meaning'       // meaning -> word
  | 'dictation_sentence'      // TTS -> type the sentence
  | 'weak_form'               // function words only
  | 'speak_sentence'          // current behavior; universal fallback

// `repetitions` rides on the queue item, so selection takes a single argument.
export function selectMode(item: EssentialWordQueueItem): EssentialWordMode
```

`selectMode` is pure: no I/O, no Dexie, no randomness. Testable as a table.

### Maturity tiers

Driven by `SRSData.repetitions`, which already exists (`lib/types.ts:104`).

| Queue state | Tier | Mode |
| - | - | - |
| `kind: 'new'` | — | `study` (unchanged) |
| `kind: 'learning'` | — | recognition (`recognize_translation` / `recognize_meaning`) |
| `review`, `repetitions <= 2` | tender | recognition |
| `review`, `repetitions 3–5` | middle | `dictation_sentence` or `weak_form` |
| `review`, `repetitions >= 6` | mature | `speak_sentence` |

This also fixes the `learning` collapse: the intermediate stage now renders a
distinct, easier mode instead of full production.

### Missing-data contract

`meaning` and `translation` are optional on `EssentialWord`; `ipa_weak` exists
only for function words (`types.ts:30`, whitelist enforced in `weak-forms.ts`).
`selectMode` checks the required field **before** returning a mode and falls
back to `speak_sentence` when it is absent.

Because `example_sentence` is mandatory, a valid mode always exists. The session
never shortens and never renders a broken card; worst case it behaves as today.

**Invariant:** `selectMode` never returns a mode whose backing data is missing.

This mirrors the decline-instead-of-fabricate rule applied to the phoneme
generators — with the difference that here a universal fallback exists, so we
fall back rather than decline.

## Data flow

`srsEntries` is already loaded in `session-loader.ts:35` and currently discarded
after `buildSessionQueue`. Phase 1 attaches `repetitions` to each queue item so
maturity is reachable **without new queries or new Dexie reads**.

1. `session-loader.ts` — carry `repetitions` onto `EssentialWordQueueItem`.
2. `useEssentialWordsSession` — expose the selected mode alongside `current`.
3. `EssentialWordsSession` — render the component for that mode instead of the
   `phase === 'speak'` branch.

`SpeakReviewCard` is untouched and becomes one mode among several.

## Components

One component per mode, each with a single responsibility:

- `RecognizeCard` — prompt (translation or meaning) + multiple choice.
- `DictationCard` — listen + type, reuses existing TTS.
- `WeakFormCard` — weak-form contrast; `weakFormPhrase` already exists in
  `lib/practice/study-card/model.ts:67` and is currently only used by
  `WordStudyCard`.
- `SpeakReviewCard` — existing, unchanged.

Distractors for `RecognizeCard` come from other words in the session queue,
deduped by surface form (same rule as `lib/lexicon/exercises.ts`).

## Result recording

`buildEssentialWordExerciseResult` currently infers speech vs text from
`extras.accuracy !== undefined`. It gains an explicit mode parameter so
`answer_history` records which mode was practiced rather than guessing. Existing
`slug` / `exerciseTypeId` values are preserved for speech and text so historical
rows stay comparable.

## Testing

`selectMode` is pure, so it is covered by a table test:

- every maturity tier maps to its expected mode
- each optional field missing (`translation`, `meaning`, `ipa_weak`) falls back
- the invariant: across all tiers x all data-presence combinations, the returned
  mode's backing data is always present
- `learning` never resolves to `speak_sentence` purely because of its kind

Component tests per mode follow existing patterns in
`components/practice/essential-words/__tests__/`.

## Open questions

None blocking. Phase 2 (multiple sentences per word) is specced separately.
