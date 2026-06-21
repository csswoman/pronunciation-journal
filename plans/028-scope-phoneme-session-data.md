# Plan 028: Fetch only the phoneme data required for a session

> **Executor instructions**: Follow this plan in order and stop on any
> mismatched data assumption.
>
> **Drift check (run first)**:
> `git diff --stat 4c35b5e..HEAD -- app/practice/sounds/sound/[soundId]/page.tsx lib/phoneme-practice/queries.ts lib/phoneme-practice/mixed-session.ts lib/practice/daily-plan`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `4c35b5e`, 2026-06-21

## Why this matters

A single sound session fetches every sound and every sound word, then repeatedly
filters the complete words array once per sound. Daily and review plan builders
repeat the same O(sounds × words) grouping and issue one minimal-pairs query per
reviewed sound. This cost grows with the content catalog even though one
session needs only the target sound and a bounded distractor/contrast pool.

## Current state

- `app/practice/sounds/sound/[soundId]/page.tsx:51-56` calls
  `getSoundById`, `getAllSounds`, `getAllWords`, and `getMinimalPairs`.
- `page.tsx:67-70` filters target words and builds a map using
  `allSounds.map(...allWords.filter(...))`.
- `lib/practice/daily-plan/composer.ts:45-58` and `:99-103` repeat the same full
  fetch and nested grouping.
- `composer.ts:74-77` fetches minimal pairs sequentially inside a loop.
- `lib/phoneme-practice/mixed-session.ts:119-175` needs target words, candidate
  sounds/words, and minimal pairs; it does not inherently require the complete
  database.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Tests | `pnpm test -- lib/phoneme-practice lib/practice/daily-plan` | pass |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:

- `lib/phoneme-practice/queries.ts`
- New dataset/query helper under `lib/phoneme-practice/`
- `app/practice/sounds/sound/[soundId]/page.tsx`
- `lib/practice/daily-plan/composer.ts`
- Related unit tests
- `docs/architecture/performance.md`

**Out of scope**:

- Exercise mix or pedagogical probabilities
- Supabase schema changes unless an existing query cannot express bounded reads
- Offline architecture
- Session UI redesign

## Git workflow

- Branch: `codex/028-scope-phoneme-session-data`
- Commit: `perf(phonemes): scope session dataset queries`

## Steps

### Step 1: Characterize generator data requirements

Add tests around `buildMixedSession`/`buildAdaptiveSession` proving a bounded
dataset containing target and configured confusable sounds generates every
current exercise type. Include sparse data and no-minimal-pair fallbacks.

**Verify**: focused generator tests pass.

### Step 2: Add a bounded session dataset query

Create a query-layer function returning:

```ts
{
  targetSound: Sound;
  sounds: Sound[];
  wordsBySoundId: Map<number, SoundWord[]>;
  minimalPairs: MinimalPair[];
}
```

Derive candidate IPA values from `PHONEME_CONFUSION[targetIpa]`, resolve only
those sounds, and fetch words with `.in("sound_id", ids)`. Apply a documented
upper bound sufficient for current generators. Keep Supabase access in the
query layer.

**Verify**: query tests assert no unfiltered `getAllWords()` call.

### Step 3: Switch the sound route

Replace the four full-catalog calls and nested filtering in the sound route
with the bounded dataset function. Preserve progress and intro behavior.

**Verify**: route/component tests pass.

### Step 4: Optimize daily/review composition

For daily plan cold-start selection, either:

- fetch only selected/weak/due sounds and their candidate word pools; or
- if the selector genuinely needs all sound metadata, fetch all lightweight
  sounds but only words for the selected candidate IDs.

Batch minimal-pair reads with `Promise.all` or one query covering all relevant
sound IDs. Build `wordsBySoundId` in one pass:

```ts
for (const word of words) {
  const bucket = map.get(word.sound_id) ?? [];
  bucket.push(word);
  map.set(word.sound_id, bucket);
}
```

Do not retain `allSounds.map(...allWords.filter(...))`.

### Step 5: Full verification and documentation

Run full gates. Document query-count and payload-shape changes. If a local
Supabase dataset is available, record row counts before/after; otherwise state
that the improvement is structurally verified, not latency-benchmarked.

## Test plan

- Bounded query selects target plus confusables.
- Empty contrast set still returns a usable target dataset.
- Session generators retain all fallbacks.
- Daily review batches minimal-pair retrieval.
- One-pass grouping returns the same map as the former nested filtering.

## Done criteria

- [ ] Sound route no longer calls `getAllWords()`.
- [ ] No nested `allSounds.map(...allWords.filter(...))` remains in production.
- [ ] Minimal-pair queries are batched for multi-sound plans.
- [ ] Exercise composition behavior remains covered and unchanged.
- [ ] Full verification suite passes.

## STOP conditions

- A generator reads arbitrary sounds outside `PHONEME_CONFUSION`.
- The bounded pool cannot reliably produce current distractor counts.
- Batching requires a database migration not already planned.

## Maintenance notes

When adding a new exercise generator, declare its dataset requirements instead
of reaching for full catalog queries.
