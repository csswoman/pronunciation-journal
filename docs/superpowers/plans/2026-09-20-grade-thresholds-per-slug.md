# Per-Slug Grade Time Thresholds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single global fast/normal response-time thresholds in `answerToGrade` with per-`ExerciseSlug` thresholds, so exercise types that are naturally slower (e.g. `reorder_words`) don't get penalized with a lower SM-2 grade for a correct answer that simply took normal time for that task type.

**Architecture:** Extract the two threshold constants into a lookup table keyed by `ExerciseSlug`, with a `DEFAULT_THRESHOLDS` entry preserving today's exact values (5000ms / 15000ms) for every slug not explicitly listed. `answerToGrade` looks up the pair for `answer.slug` before applying the existing 5/4/3 grade ladder — the ladder logic itself is unchanged, only which numbers feed it.

**Tech Stack:** TypeScript, Vitest. No new dependencies.

**Reference:** `docs/pedagogy-plans/16-adaptive-daily-plan-pacing.md`, Brief A.

---

### Task 1: Extract threshold lookup with default-preserving fallback

**Files:**
- Modify: `lib/practice/grade.ts`
- Test: `lib/practice/__tests__/grade.test.ts`

- [x] **Step 1: Write the failing test for an unmapped slug (parity with current behavior)**

Add to `lib/practice/__tests__/grade.test.ts`, inside the existing `describe('non speak_word slugs', ...)` block (this exercises the fallback path with the already-used generic `pick_word` slug from the `input()` helper, so no new fixture is needed):

```ts
    it('unmapped slug uses default thresholds unchanged (parity check)', () => {
      // pick_word has no per-slug entry — must behave exactly like today.
      expect(answerToGrade(input({ isCorrect: true, timeMs: 5000 }))).toBe(4)
      expect(answerToGrade(input({ isCorrect: true, timeMs: 15000 }))).toBe(3)
    })
```

- [x] **Step 2: Run test to verify it currently passes (behavior baseline, not a new failure)**

Run: `pnpm test -- lib/practice/__tests__/grade.test.ts -t "unmapped slug"`
Expected: PASS (this locks in current behavior before refactoring — it must still pass after Task 1's refactor, unchanged)

- [x] **Step 3: Write the failing test for a per-slug threshold on `reorder_words`**

Add a new `describe` block in the same file, after `describe('non speak_word slugs', ...)`:

```ts
  describe('per-slug thresholds', () => {
    it('reorder_words uses a higher fast/normal bar than the default', () => {
      // 6000ms is "fast" for reorder_words (naturally slower task) but would be
      // only "normal" (grade 4) under the generic 5000ms default.
      expect(
        answerToGrade(input({ slug: 'reorder_words', isCorrect: true, timeMs: 6000 })),
      ).toBe(5)

      // 20000ms is "normal" for reorder_words but would fall past the generic
      // 15000ms default into the slow bucket (grade 3).
      expect(
        answerToGrade(input({ slug: 'reorder_words', isCorrect: true, timeMs: 20_000 })),
      ).toBe(4)

      // Still slow enough to be grade 3 even under the wider reorder_words bar.
      expect(
        answerToGrade(input({ slug: 'reorder_words', isCorrect: true, timeMs: 30_001 })),
      ).toBe(3)
    })
  })
```

- [x] **Step 4: Run test to verify it fails**

Run: `pnpm test -- lib/practice/__tests__/grade.test.ts -t "per-slug thresholds"`
Expected: FAIL — `reorder_words` at 6000ms currently returns 3 (falls in the 5000-15000ms "normal" bucket under today's single global threshold), not 5.

- [x] **Step 5: Implement per-slug thresholds in `grade.ts`**

Replace the top of `lib/practice/grade.ts` (the two flat constants and their TODO comment) and the threshold-selection logic inside `answerToGrade`:

```ts
import { accuracyToQuality } from '@/lib/srs'
import type { PracticeAnswer, PracticeResultStatus } from './types'
import type { ExerciseSlug } from './types'

interface GradeTimeThresholds {
  /** Below this latency (ms), a correct answer grades as 5 (Easy). */
  fastMs: number
  /** Below this latency (ms), a correct answer grades as 4 (Good); at or above, 3 (Hard). */
  normalMs: number
}

/** Fallback for any slug without a dedicated entry — preserves pre-existing behavior exactly. */
const DEFAULT_THRESHOLDS: GradeTimeThresholds = { fastMs: 5000, normalMs: 15000 }

/**
 * Per-slug overrides for exercise types whose natural completion time differs
 * from the generic default — e.g. reorder_words involves dragging multiple
 * tokens into place and will rarely finish in under 5s even when the learner
 * knows the answer cold. Without this, such slugs are graded as "slow" (3)
 * for a normal-speed correct answer, quietly worsening their SM-2 interval.
 *
 * Slugs not listed here fall through to DEFAULT_THRESHOLDS unchanged.
 */
const SLUG_THRESHOLDS: Partial<Record<ExerciseSlug, GradeTimeThresholds>> = {
  reorder_words: { fastMs: 8000, normalMs: 30000 },
}

function thresholdsForSlug(slug: ExerciseSlug): GradeTimeThresholds {
  return SLUG_THRESHOLDS[slug] ?? DEFAULT_THRESHOLDS
}
```

Then update `answerToGrade`'s time-based branch (the tail of the function) to use `thresholdsForSlug`:

```ts
  // Use the initial response latency (excluding feedback read / retry duration) for speed rating.
  const latencyMs = answer.responseTimeMs ?? answer.timeMs
  const { fastMs, normalMs } = thresholdsForSlug(answer.slug)
  if (latencyMs < fastMs) return 5
  if (latencyMs < normalMs) return 4
  return 3
```

Leave every other line of `grade.ts` (the `scoreSlugs` branch, `isCorrect`/`firstTryFailed` early returns, the `status`/`skip` guard at the top) untouched.

- [x] **Step 6: Run tests to verify everything passes**

Run: `pnpm test -- lib/practice/__tests__/grade.test.ts`
Expected: PASS — all pre-existing cases (fallback/default slugs) plus the two new blocks from Steps 1 and 3.

- [x] **Step 7: Run full type-check**

Run: `pnpm type-check`
Expected: PASS, no new errors.

- [x] **Step 8: Commit (o dejar cambios listos para el usuario)**

```bash
git add lib/practice/grade.ts lib/practice/__tests__/grade.test.ts
git commit -m "feat(practice): per-slug time thresholds for SM-2 grading

reorder_words naturally takes longer than the generic default, so a
correct-but-normal-speed answer was grading as 'slow' (3) and quietly
worsening its SM-2 interval. Extract fast/normal thresholds into a
per-slug lookup with the existing global values as the default fallback
for every other slug — no behavior change for slugs not listed.

Ref: docs/pedagogy-plans/16-adaptive-daily-plan-pacing.md, Brief A

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Verify no other module reads the removed constants directly

**Files:**
- Read-only check: whole repo

- [x] **Step 1: Confirm nothing imports `FAST_THRESHOLD_MS` / `NORMAL_THRESHOLD_MS` from `grade.ts`**

Run: `grep -rn "FAST_THRESHOLD_MS\|NORMAL_THRESHOLD_MS" --include="*.ts" --include="*.tsx" .`
Expected: only the definitions inside `lib/practice/grade.ts` itself (now renamed/removed as flat exports — Task 1 replaced them with `DEFAULT_THRESHOLDS`/`SLUG_THRESHOLDS`, which are not exported). If this turns up a match in another file, stop and add a named export for the specific value that file needs instead of silently breaking its import.

- [x] **Step 2: Run the full test suite**

Run: `pnpm test`
Expected: PASS. This is the safety net for Task 1's refactor — `grade.ts` is exercised indirectly by any test that grades practice answers (e.g. `lib/practice/__tests__/engine.test.ts`, `lib/practice/__tests__/queries.test.ts`), not just its own unit test file.

- [x] **Step 3: No commit needed**

This task is verification-only. If Step 1 or Step 2 surfaces an issue, fix it as part of Task 1 and re-commit there instead of opening a separate commit here.

---

## Notes for future slugs

Adding a threshold for another slug (e.g. `match_pairs`, `sentence_dictation` — both called out as candidates in the pedagogy brief) is a one-line addition to `SLUG_THRESHOLDS` in `grade.ts`, plus a test case following the pattern in Task 1 Step 3. No structural change needed — this plan intentionally seeds the mechanism with just `reorder_words` rather than guessing thresholds for slugs without usage data to back a specific number.
