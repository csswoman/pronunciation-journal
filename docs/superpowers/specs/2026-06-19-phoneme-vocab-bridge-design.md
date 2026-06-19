# Phoneme ↔ Vocab Bridge — Design

> Implements `docs/pedagogy-plans/06-phoneme-vocab-bridge.md`. Date: 2026-06-19.

## Problem

Phoneme practice (`user_sound_progress`) and vocabulary (`word_bank`) have separate
SRS loops. When a learner's sound is weak, the daily plan does not surface the
learner's own `word_bank` words that contain that sound. The discrimination of
sounds lives disconnected from the learner's real vocabulary.

## Objective

When a sound is weak, bias the vocabulary selection in the daily plan toward
`word_bank` words that contain that sound — without making sessions monothematic
and without breaking when no word matches.

## Decisions (resolved)

- **Match heuristic:** IPA-only. A word matches if `word_bank.ipa` is non-null and
  contains the weak sound's IPA symbol (slashes stripped). No orthographic
  grapheme→phoneme fallback. Words without IPA are simply not candidates.
- **Bias strength:** Soft bias / partial quota. Reserve up to `ceil(limit/2)` slots
  for matched words; fill the rest from the normal selection order. Preserves
  variety; automatic fallback when there are no matches.
- **Scope:** Only `buildDailyPlan` (not `buildReviewPlan`). Optional Task 3 (use
  `word_bank` words inside the phoneme step) is **deferred** — marked optional in
  the plan, higher risk, modest gain.

## New module: `lib/practice/daily-plan/sound-word-bridge.ts`

Two pure functions, no I/O, fully unit-tested.

```ts
/** True iff word.ipa is non-null and contains the sound's IPA symbol. */
export function wordMatchesSound(word: WordBankEntry, soundIpa: string): boolean

/**
 * Soft-bias: reserve up to ceil(limit/2) slots for words matching soundIpa,
 * fill the rest from the unmatched words in input order, then any leftover
 * matched. Returns at most `limit` words, preserving relative order within
 * each group. If soundIpa is empty or there are no matches, returns
 * words.slice(0, limit) unchanged.
 */
export function biasWordsBySound(
  words: WordBankEntry[],
  soundIpa: string,
  limit: number,
): WordBankEntry[]
```

**Matching detail:** `sounds.ipa` is stored with slashes (`"/ɪ/"`); `word_bank.ipa`
is a free transcription (`"ʃɪp"`). Strip slashes from the sound IPA, then do a
substring check against the word IPA.

## Integration: `composer.ts` → `buildDailyPlan`

`reviewWords` is assembled and `primarySound` is resolved before the vocab steps
are built. Insert between those points:

```ts
if (primarySound && hasWordBank) {
  reviewWords = biasWordsBySound(reviewWords, primarySound.ipa, WORD_REVIEW_WORD_COUNT)
}
```

Gated on `hasWordBank` so Core-1000 fallback words (a different selection path with
no per-user SRS) are never reordered.

## Testing

Unit tests for both functions:
- `wordMatchesSound`: null ipa → false; substring match → true; no match → false;
  slash stripping (`"/ɪ/"` vs `"ʃɪp"`).
- `biasWordsBySound`: quota math (matched words promoted up to half); no-match →
  unchanged slice; fewer words than limit; empty soundIpa → unchanged; order
  preserved within groups.

Acceptance: `pnpm type-check && pnpm test` green; a weak sound influences which
word_bank words enter the vocab step; no-match falls back to current behavior.
