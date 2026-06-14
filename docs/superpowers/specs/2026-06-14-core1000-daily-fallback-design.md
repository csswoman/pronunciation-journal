# Core 1000 Fallback for Daily Plan

**Date:** 2026-06-14  
**Status:** Approved

## Problem

When a user has no words in their `word_bank`, or has words but none are new or SRS-due today, the `word_review` and `context_practice` steps are silently skipped. The daily plan fills those slots with extra phoneme steps from the seed catalog. This is suboptimal for new users or users who have completed their SRS queue: the vocabulary practice steps disappear entirely.

## Solution

When `reviewWords` is empty after fetching from `word_bank`, fall back to a selection of Core 1000 words. These words have `example_sentence` (required field) and `ipa_strong`, so they work with all existing exercise generators without modification. The UI shows no difference — the step labels remain the same.

## Trigger Conditions

The fallback activates when `reviewWords.length === 0` after the existing fetch logic in `buildDailyPlan`:

1. **Zero words in word_bank** — new user with no saved words
2. **No new or SRS-due words today** — existing user whose queue is fully caught up

## Word Selection

- Source: `public/core-1000/words-NNN.json` chunks (15 chunks, ranks 1–2800)
- Filter: `word.length >= 4` — excludes function words like "the", "a", "is", "of"
- Order: by rank ascending (A1-level words first, most frequent)
- Count: `WORD_REVIEW_WORD_COUNT` words (currently 6)
- Rotation: deterministic by `dayOfYear()` — same user sees different words each day, same words on the same calendar day regardless of reload
- Chunk strategy: load only the chunk(s) needed to satisfy count after filtering; start from chunk 001 (lowest rank) and advance if needed

## Data Adapter: `CoreWord → WordBankEntry`

| WordBankEntry field | Source |
|---|---|
| `id` | `core1k:${w.word}` (synthetic, stable) |
| `user_id` | `''` (not used by generators) |
| `text` | `w.word` |
| `meaning` | `undefined` |
| `example` | `w.example_sentence` |
| `ipa` | `w.ipa_strong` |
| `difficulty` | A1/A2 → `1`, B1/B2 → `2`, C1 → `3` |
| `srs_status` | `'new'` |
| `status` | `'ready'` |
| remaining fields | `null` / `undefined` |

The exercise generators only require `text` and `example` — all other fields are optional in practice.

## Architecture

### New file: `lib/core-1000/client-fetch.ts`

```ts
// fetchCoreWordsForDay(day, count): Promise<CoreWord[]>
// — fetches /core-1000/words-NNN.json via browser fetch
// — filters word.length >= 4
// — rotates slice by dayOfYear()

// coreWordToWordBankEntry(w: CoreWord): WordBankEntry
// — pure adapter, no I/O
```

### Modified file: `lib/practice/daily-plan.ts`

After the existing `fetchNewWords` + `fetchDueWords` block (~line 521–526), add:

```ts
if (reviewWords.length === 0) {
  const coreWords = await fetchCoreWordsForDay(dayOfYear(), WORD_REVIEW_WORD_COUNT)
  reviewWords = coreWords.map(coreWordToWordBankEntry)
}
```

No other files change.

## Downstream effects

- `buildWordReviewStep(reviewWords)` — works unchanged, generates fill-blank / dictation / reorder / match-pairs
- `buildContextPracticeStep(reviewWords)` — works unchanged; Core 1000 words all have `example_sentence`, so `usable.length >= 2` is satisfied for 6 words
- `isNewUser` flag — still correct: it's `!hasWordBank && !hasProgress`, computed before the fallback mutates `reviewWords`
- `buildReviewPlan` — not affected; it uses `fetchDueReviewWords` which is a separate query

## Out of scope

- Showing any UI indicator that Core 1000 words are being used
- Saving Core 1000 fallback words to the user's word_bank automatically
- Using Core 1000 words for the `context_practice` step specifically (it benefits automatically via shared `reviewWords`)
- Personalizing Core 1000 selection by user CEFR level
