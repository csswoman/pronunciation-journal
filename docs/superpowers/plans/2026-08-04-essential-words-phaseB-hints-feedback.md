# Essential Words — Fase B: Hints con precio y feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every card's direct `onGraded(quality: number)` call with an `AttemptOutcome`-driven grading pipeline (hints priced, typos forgiven, rescue always grades Again), add the length-aware hint ladder and diff-based failure feedback, and flip the level-3 flag Fase A left dark — making the Fase A+B redesign shippable to users.

**Architecture:** A new pure module `lib/essential-words/attempt-grade.ts` is the single place `AttemptOutcome` maps to a `Grade`. Every card is migrated from `onGraded(quality)` to `onAttempt(outcome: AttemptOutcome)`; the hook (not touched by this plan beyond the flag flip — `useEssentialWordsSession.ts`'s `submitGrade` already accepts a numeric quality, so a thin adapter inside each card converts `Grade` to the existing 0-5 scale at the call boundary, keeping Fase A's hook untouched). `hint-ladder.ts`, `typo.ts`, and `distractors.ts` are pure, mode/length-aware modules consumed by two new shared components (`HintButton`, `AnswerDiff`) and wired into each card individually.

**Tech Stack:** TypeScript, React 19, Vitest, `@testing-library/react`, existing `vi.mock('@/lib/phoneme-practice/tts', ...)` conventions.

**Spec:** `docs/superpowers/specs/2026-08-04-essential-words-learning-sessions-design.md`, §2 in full, plus the level-3 flag flip from "Fases A y B se despliegan juntas".

---

## Context the engineer needs

- **Every card today calls `onGraded` directly with a hardcoded number.** Confirmed by reading `DictationCard.tsx`, `ClozeCard.tsx`, `RecognizeCard.tsx`: each has `const CORRECT_QUALITY = 5` / `const WRONG_QUALITY = 2` and calls `void onGraded(isCorrect ? CORRECT_QUALITY : WRONG_QUALITY)`. `RecognizeAudioCard.tsx` and `RecallTranslationCard.tsx` follow the identical pattern (verify before Task 6/7, but do not assume a different shape without checking). This plan replaces that pattern everywhere.
- **`SpeakReviewCard.tsx` has a different signature and is already 296 lines** (over the 250-line convention, at the ESLint 300-line warning threshold). Its `onGraded` signature is `(quality: number, extras?: { accuracy: number; transcript: string }) => Promise<void>` — richer than the other cards because it also has self-grade (mic-unavailable) and speech-scoring paths. Task 9 handles this migration separately and more carefully than the others, and must not push the file over 300 lines — extract if needed (see Task 9's file-structure note).
- **`RecognizeCard.tsx` and `RecognizeAudioCard.tsx` build distractors ad hoc.** `RecognizeCard.tsx`'s `useMemo` dedupes by lowercase surface form only — no `pos`/orthographic-distance/homophone filtering. Task 4 extracts this into `distractors.ts` and Task 6/Task-for-RecognizeAudioCard replace the inline logic with a call to it.
- **No hints exist today on any card.** All hint-ladder wiring in Tasks 8, 9 is new UI, not a modification of existing hint code.
- **`useEssentialWordsSession.ts`'s `distractorPool`** (from Fase A) is "every other word currently in the plan" — not policy-filtered. This plan's `distractors.ts` (Task 4) takes the pool the hook already provides plus the full dataset as fallback, and applies policy filtering *inside the card*, not by changing what the hook passes down — this keeps Fase B decoupled from re-touching Fase A's hook.
- Test convention across this codebase's essential-words card tests: `// @vitest-environment jsdom` header comment, `@testing-library/react`'s `render`/`screen`/`fireEvent`, `vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))` for any card that plays audio, small local fixture-builder functions (`function word(overrides = {})`), no `data-testid` — always query by role/label/text.
- CLAUDE.md requires a `// Planned structure:` comment block (listing sub-components) before implementing any new component — follow it for `HintButton.tsx` and `AnswerDiff.tsx` (Task 5, Task 6).

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `lib/essential-words/attempt-grade.ts` | Create | `AttemptOutcome` → `Grade` (§2.1), the sole place hints/typos/rescue/latency become a grade |
| `lib/essential-words/hint-ladder.ts` | Create | Length-aware, mode-aware hint rungs (§2.3), which rungs are priced vs. free |
| `lib/essential-words/typo.ts` | Create | Semantic typo detection (§2.6) — not a length threshold |
| `lib/essential-words/distractors.ts` | Create | Distractor selection policy (§2.4b): pool-first, category/distance/homophone filtered |
| `components/practice/essential-words/HintButton.tsx` | Create | Discrete hint button: hidden until first fail/~5s idle, renders current rung |
| `components/practice/essential-words/AnswerDiff.tsx` | Create | Diff-based failure feedback, typo-aware, optional per-word explanation |
| `lib/essential-words/word-explanations.ts` | Create | Small lookup table for the optional "por qué" explanation string (§2.5) |
| `components/practice/essential-words/DictationCard.tsx` | Modify | `onAttempt`, hint ladder (audio free), latency, typo |
| `components/practice/essential-words/ClozeCard.tsx` | Modify | `onAttempt`, hint ladder (audio priced), latency, typo |
| `components/practice/essential-words/RecognizeCard.tsx` | Modify | `onAttempt`, no hints, `distractors.ts` |
| `components/practice/essential-words/RecognizeAudioCard.tsx` | Modify | `onAttempt`, no hints, `distractors.ts` |
| `components/practice/essential-words/RecallTranslationCard.tsx` | Modify | `onAttempt`, hint ladder, typo |
| `components/practice/essential-words/WeakFormCard.tsx` | Modify | `onAttempt` for grading-contract consistency (stays out of first-encounter flow per spec §1.5 — this is only a signature migration, not a scope change) |
| `components/practice/essential-words/SpeakReviewCard.tsx` | Modify | `onAttempt`, rescue-adjacent bookkeeping preserved |
| `components/practice/essential-words/EssentialWordsSession.tsx` | Modify | Pass `onAttempt` through to each card instead of `onGraded` |
| `lib/essential-words/level3-flag.ts` | Modify | Flip default (or document the env-var flip) now hints/feedback exist |

Every new `lib/` file stays a small, focused pure module. `HintButton.tsx`/`AnswerDiff.tsx` are new small components, well under 100 lines each. Card migrations are additive (new prop, new internal state) — none should cross 250 lines from this change alone; if one does, extract the hint-ladder wiring into a small shared hook (see Task 9's note for `SpeakReviewCard`, the one file already near the limit).

---

### Task 1: `lib/essential-words/attempt-grade.ts` — the single grading module

**Files:**
- Create: `lib/essential-words/attempt-grade.ts`
- Test: `lib/essential-words/__tests__/attempt-grade.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/essential-words/__tests__/attempt-grade.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { attemptGrade, gradeToLegacyQuality, LOW_LATENCY_MS, type AttemptOutcome } from "../attempt-grade";

function outcome(overrides: Partial<AttemptOutcome> = {}): AttemptOutcome {
  return {
    correct: true, hintsUsed: 0, rescued: false, typo: false, firstTryFailed: false,
    latencyMs: 1000,
    ...overrides,
  };
}

describe("attemptGrade — spec §2.1 grade table", () => {
  it("no hints, low latency, correct -> Easy", () => {
    expect(attemptGrade(outcome({ latencyMs: LOW_LATENCY_MS - 1 }))).toBe("Easy");
  });

  it("no hints, latency not low, correct -> Good", () => {
    expect(attemptGrade(outcome({ latencyMs: LOW_LATENCY_MS + 1 }))).toBe("Good");
  });

  it("1 priced hint -> Hard, regardless of latency", () => {
    expect(attemptGrade(outcome({ hintsUsed: 1, latencyMs: 100 }))).toBe("Hard");
  });

  it("2+ priced hints -> Again, even if eventually correct", () => {
    expect(attemptGrade(outcome({ hintsUsed: 2 }))).toBe("Again");
    expect(attemptGrade(outcome({ hintsUsed: 3 }))).toBe("Again");
  });

  it("rescued to multiple choice -> Again ALWAYS, even when correct and hintsUsed is 0 (spec §2.4)", () => {
    expect(attemptGrade(outcome({ rescued: true, correct: true, hintsUsed: 0 }))).toBe("Again");
    expect(attemptGrade(outcome({ rescued: true, correct: false }))).toBe("Again");
  });

  it("firstTryFailed (failed, retried without hints, then correct) -> Again — failed recovery, decided explicitly (spec §2.2)", () => {
    expect(attemptGrade(outcome({ firstTryFailed: true, hintsUsed: 0, correct: true }))).toBe("Again");
  });

  it("typo is treated as correct without penalty — same grade as a clean correct answer", () => {
    const clean = attemptGrade(outcome({ typo: false, latencyMs: 500 }));
    const typo = attemptGrade(outcome({ typo: true, latencyMs: 500 }));
    expect(typo).toBe(clean);
  });

  it("an outright incorrect (not typo, not rescued) attempt -> Again", () => {
    expect(attemptGrade(outcome({ correct: false, typo: false, rescued: false, hintsUsed: 0 }))).toBe("Again");
  });

  it("precedence: rescued overrides everything else, including firstTryFailed and typo", () => {
    expect(
      attemptGrade(outcome({ rescued: true, correct: true, typo: true, firstTryFailed: true, hintsUsed: 0 })),
    ).toBe("Again");
  });

  it("precedence: firstTryFailed overrides hint count and latency", () => {
    expect(
      attemptGrade(outcome({ firstTryFailed: true, hintsUsed: 0, latencyMs: 1 })),
    ).toBe("Again");
  });

  it("precedence: 2+ hints overrides low latency (still Again, not Easy)", () => {
    expect(attemptGrade(outcome({ hintsUsed: 2, latencyMs: 1 }))).toBe("Again");
  });
});

describe("gradeToLegacyQuality — bridges Grade to the existing 0-5 scheduler input", () => {
  it("maps each Grade to a distinct quality in [0,5], preserving Again < Hard < Good < Easy ordering", () => {
    const again = gradeToLegacyQuality("Again");
    const hard = gradeToLegacyQuality("Hard");
    const good = gradeToLegacyQuality("Good");
    const easy = gradeToLegacyQuality("Easy");
    expect(again).toBeLessThan(hard);
    expect(hard).toBeLessThan(good);
    expect(good).toBeLessThan(easy);
    expect(again).toBeGreaterThanOrEqual(0);
    expect(easy).toBeLessThanOrEqual(5);
  });

  it("Again maps below the SM-2 pass threshold of 3 (existing hook logic branches on quality >= 3)", () => {
    expect(gradeToLegacyQuality("Again")).toBeLessThan(3);
  });

  it("Hard, Good, Easy all map to >= 3 (all count as a passing attempt)", () => {
    expect(gradeToLegacyQuality("Hard")).toBeGreaterThanOrEqual(3);
    expect(gradeToLegacyQuality("Good")).toBeGreaterThanOrEqual(3);
    expect(gradeToLegacyQuality("Easy")).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/essential-words/__tests__/attempt-grade.test.ts`
Expected: FAIL — cannot resolve `../attempt-grade`.

- [ ] **Step 3: Write the implementation**

Create `lib/essential-words/attempt-grade.ts`:

```ts
// The single place AttemptOutcome -> Grade happens (spec §2.1). Cards emit
// AttemptOutcome, never a raw number — this is what makes the eventual
// SM-2 -> FSRS migration (Fase C) a one-file change instead of a rewrite of
// every card.

/** What actually happened on one graded attempt. Cards build this; nothing
 *  downstream should reconstruct it from partial data. */
export interface AttemptOutcome {
  correct: boolean;
  /** Count of PRICED hint-ladder rungs only (see hint-ladder.ts) — free rungs
   *  (e.g. unlimited dictation-audio replay) never increment this. */
  hintsUsed: number;
  /** True when the attempt was rescued to multiple choice after a fail. */
  rescued: boolean;
  /** True when the written answer was a typo of the correct answer (see typo.ts). */
  typo: boolean;
  /** True when the FIRST attempt (before any retry) failed, and this outcome
   *  represents the eventual retry that succeeded. */
  firstTryFailed: boolean;
  /** Time from render/first-focus to submit, milliseconds. */
  latencyMs: number;
}

export type Grade = "Again" | "Hard" | "Good" | "Easy";

/** Latency threshold below which a clean answer counts as Easy, not Good
 *  (spec §2.1: "un acierto correcto a los 25 s es Good, no Easy"). */
export const LOW_LATENCY_MS = 25_000;

/**
 * Maps an AttemptOutcome to a Grade, in precedence order (spec §2.1/§2.4):
 *   1. rescued            -> Again, ALWAYS, regardless of correct/hints/typo.
 *      Rescue is emotional relief, not evaluation (spec §2.4) — it always
 *      grades Again even if the rescued multiple-choice answer is correct.
 *   2. firstTryFailed      -> Again. The initial attempt failed recovery;
 *      that it succeeded on retry only measures working memory, not recall.
 *   3. hintsUsed >= 2      -> Again. Two or more priced hints means the item
 *      is effectively lost for this review — the 3rd hint and reveal are
 *      "free" past this point in terms of grade (spec §2.7): once Again is
 *      locked in, using more hints cannot make the grade worse.
 *   4. hintsUsed === 1     -> Hard.
 *   5. correct, no hints, latency < LOW_LATENCY_MS -> Easy.
 *   6. correct, no hints, otherwise                -> Good.
 *   7. not correct (and none of the above applied) -> Again.
 *
 * Typo is deliberately NOT a branch here: a typo-flagged outcome is treated
 * as `correct: true` by the caller before this function ever sees it (spec
 * §2.6 — "se acepta, se marca la corrección y no se penaliza"), so it falls
 * through to the same Easy/Good branches as a clean correct answer.
 */
export function attemptGrade(outcome: AttemptOutcome): Grade {
  if (outcome.rescued) return "Again";
  if (outcome.firstTryFailed) return "Again";
  if (outcome.hintsUsed >= 2) return "Again";
  if (outcome.hintsUsed === 1) return "Hard";
  if (!outcome.correct) return "Again";
  return outcome.latencyMs < LOW_LATENCY_MS ? "Easy" : "Good";
}

/**
 * Bridges Grade to the existing 0-5 "quality" scale useEssentialWordsSession
 * .ts's submitGrade already branches on (quality >= 3 = pass). This lets
 * every card call the unchanged Fase A hook while still building its outcome
 * through attemptGrade — Fase C's FSRS migration replaces this bridge with a
 * direct Grade-consuming scheduler call, without touching any card again.
 */
export function gradeToLegacyQuality(grade: Grade): number {
  switch (grade) {
    case "Again": return 2;
    case "Hard": return 3;
    case "Good": return 4;
    case "Easy": return 5;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/essential-words/__tests__/attempt-grade.test.ts`
Expected: PASS — 13 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/attempt-grade.ts lib/essential-words/__tests__/attempt-grade.test.ts
git commit -m "feat(essential-words): add attempt-grade — single AttemptOutcome to Grade mapping (spec §2.1)"
```

---

### Task 2: `lib/essential-words/typo.ts` — semantic typo detection

**Files:**
- Create: `lib/essential-words/typo.ts`
- Test: `lib/essential-words/__tests__/typo.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/essential-words/__tests__/typo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isTypo } from "../typo";

describe("isTypo — semantic criterion, not a length threshold (spec §2.6)", () => {
  it("accepts a doubled-letter typo of a longer word", () => {
    expect(isTypo("hapy", "happy")).toBe(true);
  });

  it("accepts an adjacent-key typo", () => {
    expect(isTypo("wprk", "work")).toBe(true); // o/p adjacent on QWERTY
  });

  it("accepts a transposition typo", () => {
    expect(isTypo("teh", "the")).toBe(true);
  });

  it("NEVER treats a real dataset collision as a typo, even at distance 1 — 'he' for 'be'", () => {
    expect(isTypo("he", "be")).toBe(false);
  });

  it("NEVER treats 'to' for 'do' as a typo, even at distance 1", () => {
    expect(isTypo("to", "do")).toBe(false);
  });

  it("NEVER treats 'of' for 'on' as a typo, even at distance 1", () => {
    expect(isTypo("of", "on")).toBe(false);
  });

  it("NEVER treats 'in' for 'it' as a typo", () => {
    expect(isTypo("in", "it")).toBe(false);
  });

  it("rejects an answer that is itself a valid, unrelated word at distance > 1", () => {
    expect(isTypo("cat", "dog")).toBe(false);
  });

  it("rejects an exact match (not a typo — it's just correct)", () => {
    expect(isTypo("happy", "happy")).toBe(false);
  });

  it("rejects a completely different word", () => {
    expect(isTypo("banana", "elephant")).toBe(false);
  });

  it("works on words of any length, not just long ones — 'ot' for 'to' is a transposition typo", () => {
    expect(isTypo("ot", "to")).toBe(true);
  });

  it("case-insensitive", () => {
    expect(isTypo("Hapy", "happy")).toBe(true);
    expect(isTypo("HE", "be")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/essential-words/__tests__/typo.test.ts`
Expected: FAIL — cannot resolve `../typo`.

- [ ] **Step 3: Write the implementation**

Create `lib/essential-words/typo.ts`:

```ts
// Semantic typo detection (spec §2.6). Deliberately NOT a length-based
// Levenshtein-distance-1 threshold: measured against this dataset, 47.4% of
// the top-500 words have <=4 letters, and 624 short words collide with
// another dataset word at distance 1 (be/he, to/do, of/on, in/it). A
// length-blind distance-1 rule would accept "he" as a typo of "be" —
// converting real unfamiliarity into a false pass and poisoning the grade.
//
// A typed answer is a typo only if BOTH hold:
//   1. it is NOT itself a real word (checked against a small closed set of
//      known collision words — the dataset's own vocabulary — so a genuine
//      different word never qualifies), and
//   2. the edit from the answer to the target belongs to a typical typing-
//      error class: adjacent QWERTY key, a doubled letter, or a transposed
//      adjacent pair.

// Adjacency map for a standard QWERTY layout — only the letters that matter
// for typo classification (rows only; enough for realistic near-misses).
const ADJACENT: Record<string, string[]> = {
  q: ["w", "a"], w: ["q", "e", "a", "s"], e: ["w", "r", "s", "d"], r: ["e", "t", "d", "f"],
  t: ["r", "y", "f", "g"], y: ["t", "u", "g", "h"], u: ["y", "i", "h", "j"], i: ["u", "o", "j", "k"],
  o: ["i", "p", "k", "l"], p: ["o", "l"],
  a: ["q", "w", "s", "z"], s: ["a", "w", "e", "d", "z", "x"], d: ["s", "e", "r", "f", "x", "c"],
  f: ["d", "r", "t", "g", "c", "v"], g: ["f", "t", "y", "h", "v", "b"], h: ["g", "y", "u", "j", "b", "n"],
  j: ["h", "u", "i", "k", "n", "m"], k: ["j", "i", "o", "l", "m"], l: ["k", "o", "p"],
  z: ["a", "s", "x"], x: ["z", "s", "d", "c"], c: ["x", "d", "f", "v"], v: ["c", "f", "g", "b"],
  b: ["v", "g", "h", "n"], n: ["b", "h", "j", "m"], m: ["n", "j", "k"],
};

function isAdjacentKeyTypo(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diffIndex = -1, diffCount = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) { diffCount++; diffIndex = i; if (diffCount > 1) return false; }
  }
  if (diffCount !== 1) return false;
  return (ADJACENT[a[diffIndex]] ?? []).includes(b[diffIndex]);
}

function isDoubledLetterTypo(a: string, b: string): boolean {
  // One is the other with a single character duplicated once (or missing a
  // duplicate): |len diff| === 1, and removing the extra char from the
  // longer one yields the shorter one.
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  if (longer.length - shorter.length !== 1) return false;
  for (let i = 0; i < longer.length; i++) {
    const candidate = longer.slice(0, i) + longer.slice(i + 1);
    if (candidate === shorter) return true;
  }
  return false;
}

function isTranspositionTypo(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let firstDiff = -1;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) { firstDiff = i; break; }
  }
  if (firstDiff === -1) return false; // identical — not a typo
  const i = firstDiff;
  if (i + 1 >= a.length) return false;
  const swapped = a.slice(0, i) + a[i + 1] + a[i] + a.slice(i + 2);
  return swapped === b;
}

function isTypingErrorClass(written: string, target: string): boolean {
  return (
    isAdjacentKeyTypo(written, target) ||
    isDoubledLetterTypo(written, target) ||
    isTranspositionTypo(written, target)
  );
}

/**
 * True when `written` is a typo of `target`: not itself a valid word, and
 * the edit belongs to a typical typing-error class. `isKnownWord` lets
 * callers pass the actual dataset vocabulary (or any validator) so a real
 * collision word is never misclassified — defaults to a small built-in set
 * covering the dataset's documented high-frequency collision pairs so this
 * function is usable standalone without wiring the full word list.
 */
const KNOWN_COLLISION_WORDS = new Set([
  "he", "be", "to", "do", "of", "on", "in", "it", "so", "no", "go", "we", "me",
  "him", "her", "his", "any", "and",
]);

export function isTypo(
  written: string,
  target: string,
  isKnownWord: (w: string) => boolean = (w) => KNOWN_COLLISION_WORDS.has(w),
): boolean {
  const w = written.trim().toLowerCase();
  const t = target.trim().toLowerCase();
  if (w === t) return false;
  if (isKnownWord(w)) return false;
  return isTypingErrorClass(w, t);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/essential-words/__tests__/typo.test.ts`
Expected: PASS — 12 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/typo.ts lib/essential-words/__tests__/typo.test.ts
git commit -m "feat(essential-words): add semantic typo detection, not a length threshold (spec §2.6)"
```

---

### Task 3: `lib/essential-words/hint-ladder.ts` — length-aware, mode-aware hint rungs

**Files:**
- Create: `lib/essential-words/hint-ladder.ts`
- Test: `lib/essential-words/__tests__/hint-ladder.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/essential-words/__tests__/hint-ladder.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildHintLadder, type HintRung } from "../hint-ladder";
import type { EssentialWord } from "../types";

function word(overrides: Partial<EssentialWord> = {}): EssentialWord {
  return {
    rank: 1, word: "happy", pos: "adjective", ipa_strong: "/ˈhæpi/",
    example_sentence: "She feels happy today.", cefr_level: "A1",
    meaning: "feeling good", translation: "feliz",
    ...overrides,
  };
}

describe("buildHintLadder — length-aware (spec §2.3)", () => {
  it("a >=5-letter word gets 4 rungs: category, audio, first-letter, reveal", () => {
    const ladder = buildHintLadder(word({ word: "happy" }), "cloze_sentence");
    expect(ladder.map((r) => r.kind)).toEqual(["category", "audio", "firstLetter", "reveal"]);
  });

  it("a 2-4 letter word gets 3 rungs, no letter count in category and no firstLetter rung", () => {
    const ladder = buildHintLadder(word({ word: "to", pos: "preposition" }), "cloze_sentence");
    expect(ladder.map((r) => r.kind)).toEqual(["category", "audio", "reveal"]);
  });

  it("category rung for a short word omits the letter count", () => {
    const ladder = buildHintLadder(word({ word: "to", pos: "preposition" }), "cloze_sentence");
    const category = ladder.find((r) => r.kind === "category")!;
    expect(category.content).not.toMatch(/\d+ letras/);
  });

  it("category rung for a long word includes the letter count", () => {
    const ladder = buildHintLadder(word({ word: "happy", pos: "adjective" }), "cloze_sentence");
    const category = ladder.find((r) => r.kind === "category")!;
    expect(category.content).toMatch(/5 letras/);
  });

  it("no rung's content ever equals the target word itself (no rung gives the full answer)", () => {
    for (const mode of ["cloze_sentence", "dictation_sentence", "dictation_word", "recall_translation"] as const) {
      const ladder = buildHintLadder(word({ word: "happy" }), mode);
      for (const rung of ladder) {
        if (rung.kind === "reveal") continue; // reveal is the explicit give-up rung, exempt by design
        expect(rung.content.toLowerCase()).not.toBe("happy");
      }
    }
  });

  it("reveal always counts as a fail — priced is false is WRONG for reveal; reveal is a distinct terminal rung, never priced (it's a give-up, not a hint)", () => {
    const ladder = buildHintLadder(word({ word: "happy" }), "cloze_sentence");
    const reveal = ladder.find((r) => r.kind === "reveal")!;
    expect(reveal.priced).toBe(false);
    expect(reveal.isGiveUp).toBe(true);
  });

  it("category and first-letter rungs are priced", () => {
    const ladder = buildHintLadder(word({ word: "happy" }), "cloze_sentence");
    expect(ladder.find((r) => r.kind === "category")!.priced).toBe(true);
    expect(ladder.find((r) => r.kind === "firstLetter")!.priced).toBe(true);
  });

  it("audio is FREE when it IS the prompt (dictation_word, dictation_sentence) — spec §2.3 corrected rule", () => {
    const dictationWordLadder = buildHintLadder(word(), "dictation_word");
    const dictationSentenceLadder = buildHintLadder(word(), "dictation_sentence");
    expect(dictationWordLadder.find((r) => r.kind === "audio")!.priced).toBe(false);
    expect(dictationSentenceLadder.find((r) => r.kind === "audio")!.priced).toBe(false);
  });

  it("audio is PRICED when it does not form part of the enunciado (cloze_sentence's optional word-audio)", () => {
    const clozeLadder = buildHintLadder(word(), "cloze_sentence");
    expect(clozeLadder.find((r) => r.kind === "audio")!.priced).toBe(true);
  });

  it("audio is PRICED for recall_translation (the enunciado is the Spanish prompt, not audio)", () => {
    const ladder = buildHintLadder(word(), "recall_translation");
    expect(ladder.find((r) => r.kind === "audio")!.priced).toBe(true);
  });

  it("multiple-choice modes (recognize_*) have NO hints at all — empty ladder", () => {
    for (const mode of ["recognize_translation", "recognize_meaning", "recognize_audio"] as const) {
      expect(buildHintLadder(word(), mode)).toEqual([]);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/essential-words/__tests__/hint-ladder.test.ts`
Expected: FAIL — cannot resolve `../hint-ladder`.

- [ ] **Step 3: Write the implementation**

Create `lib/essential-words/hint-ladder.ts`:

```ts
// Length-aware, mode-aware hint ladder (spec §2.3). Pure — no I/O, no
// rendering. HintButton.tsx (Task 5) walks this ladder; attempt-grade.ts
// only cares about the COUNT of priced rungs used (AttemptOutcome.hintsUsed),
// not which rungs specifically — that distinction lives here.

import type { EssentialWord } from "./types";
import type { EssentialWordMode } from "./exercise-modes";

export type HintRungKind = "category" | "audio" | "firstLetter" | "reveal";

export interface HintRung {
  kind: HintRungKind;
  /** Human-readable hint content (Spanish UI copy). Never equals the target
   *  word for any rung except `reveal`, which is the explicit give-up step. */
  content: string;
  /** Whether taking this rung counts toward AttemptOutcome.hintsUsed. */
  priced: boolean;
  /** True only for `reveal` — taking it is giving up, not a graded hint;
   *  it counts as a fail via `correct: false` on the outcome, not via price. */
  isGiveUp: boolean;
}

const SHORT_WORD_MAX_LENGTH = 4;

/** Audio is free exactly when it IS the exercise's own prompt — the learner
 *  hears the answer's phonology as the task itself, not as an assist. */
const AUDIO_IS_PROMPT_MODES: ReadonlySet<EssentialWordMode> = new Set([
  "dictation_word" as EssentialWordMode, // introduced by Fase B alongside recall level 2
  "dictation_sentence",
]);

/** Modes with no hint ladder at all — already reconnaissance, not production. */
const NO_HINT_MODES: ReadonlySet<EssentialWordMode> = new Set([
  "recognize_translation", "recognize_meaning", "recognize_audio",
]);

function posLabel(pos: EssentialWord["pos"]): string {
  const labels: Record<EssentialWord["pos"], string> = {
    noun: "sustantivo", verb: "verbo", adjective: "adjetivo", adverb: "adverbio",
    pronoun: "pronombre", preposition: "preposición", conjunction: "conjunción",
    determiner: "determinante", article: "artículo", modal: "modal",
    auxiliary: "auxiliar", number: "número", interjection: "interjección",
  };
  return labels[pos] ?? pos;
}

function categoryContent(entry: EssentialWord, isShort: boolean): string {
  const label = posLabel(entry.pos);
  return isShort ? label : `${label}, ${entry.word.length} letras`;
}

function firstLetterContent(entry: EssentialWord): string {
  return `${entry.word[0]} ${"_ ".repeat(entry.word.length - 1).trim()}`;
}

/**
 * Builds the hint ladder for one word+mode pairing. Returns [] for
 * multiple-choice modes (no hints at all — eliminating a distractor would
 * make reconnaissance trivial; better to fail fast and get feedback).
 *
 * Longer words (>=5 letters) get 4 rungs: category (with letter count) ->
 * audio -> first letter -> reveal. Short words (2-4 letters) get 3: category
 * (no letter count — "verbo auxiliar, 2 letras" already nearly gives away
 * "be") -> audio -> reveal, skipping the first-letter rung entirely, since
 * "b _" on a 2-letter word gives the whole answer.
 */
export function buildHintLadder(entry: EssentialWord, mode: EssentialWordMode): HintRung[] {
  if (NO_HINT_MODES.has(mode)) return [];

  const isShort = entry.word.length <= SHORT_WORD_MAX_LENGTH;
  const audioPriced = !AUDIO_IS_PROMPT_MODES.has(mode);

  const rungs: HintRung[] = [
    { kind: "category", content: categoryContent(entry, isShort), priced: true, isGiveUp: false },
    { kind: "audio", content: "Escuchar la palabra", priced: audioPriced, isGiveUp: false },
  ];
  if (!isShort) {
    rungs.push({ kind: "firstLetter", content: firstLetterContent(entry), priced: true, isGiveUp: false });
  }
  rungs.push({ kind: "reveal", content: entry.word, priced: false, isGiveUp: true });
  return rungs;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/essential-words/__tests__/hint-ladder.test.ts`
Expected: PASS — 11 tests.

> Note: `dictation_word` is referenced as an `EssentialWordMode` literal here even though it isn't added to the `EssentialWordMode` union in `exercise-modes.ts` by this plan (spec §1.5 introduces it as part of level 2, and it's Fase A/B's shared responsibility — verify whether Fase A's plan already added it to the union before running this task; if not, add the single string `"dictation_word"` to the `EssentialWordMode` type union in `lib/essential-words/exercise-modes.ts` as part of this task's Step 3, since `hint-ladder.ts` cannot compile against a mode the type doesn't know about). Confirm with `pnpm type-check` after Step 3 and fix the union first if it fails on this literal.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/hint-ladder.ts lib/essential-words/__tests__/hint-ladder.test.ts
git commit -m "feat(essential-words): add length- and mode-aware hint ladder (spec §2.3)"
```

---

### Task 4: `lib/essential-words/distractors.ts` — distractor selection policy

**Files:**
- Create: `lib/essential-words/distractors.ts`
- Test: `lib/essential-words/__tests__/distractors.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/essential-words/__tests__/distractors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { selectDistractors } from "../distractors";
import type { EssentialWord } from "../types";

function w(rank: number, word: string, pos: EssentialWord["pos"] = "noun"): EssentialWord {
  return { rank, word, pos, ipa_strong: `/${word}/`, example_sentence: `I see the ${word}.`, cefr_level: "A1" };
}

describe("selectDistractors — spec §2.4b policy", () => {
  it("excludes candidates at orthographic distance 1 from the target", () => {
    const target = w(1, "be", "auxiliary");
    const pool = [w(2, "he", "pronoun"), w(3, "we", "pronoun"), w(4, "cat", "noun"), w(5, "dog", "noun")];
    const result = selectDistractors(target, pool, [], 3);
    expect(result.map((r) => r.word)).not.toContain("he");
    expect(result.map((r) => r.word)).not.toContain("we");
  });

  it("prefers same grammatical category", () => {
    const target = w(1, "run", "verb");
    const pool = [w(2, "jump", "verb"), w(3, "table", "noun"), w(4, "swim", "verb")];
    const result = selectDistractors(target, pool, [], 2);
    expect(result.map((r) => r.word).sort()).toEqual(["jump", "swim"]);
  });

  it("excludes known homophones of the target", () => {
    const target = w(1, "be", "auxiliary");
    const pool = [w(2, "bee", "noun"), w(3, "cat", "noun"), w(4, "dog", "noun")];
    const result = selectDistractors(target, pool, ["bee"], 2);
    expect(result.map((r) => r.word)).not.toContain("bee");
  });

  it("dedupes by surface form (case-insensitive)", () => {
    const target = w(1, "cat", "noun");
    const pool = [w(2, "Dog", "noun"), w(3, "dog", "noun"), w(4, "bird", "noun")];
    const result = selectDistractors(target, pool, [], 3);
    const lower = result.map((r) => r.word.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });

  it("relaxes category before distance when the pool is too small under strict filtering", () => {
    // Only cross-category candidates available, none at unsafe distance.
    const target = w(1, "run", "verb");
    const pool = [w(2, "table", "noun"), w(3, "chair", "noun")];
    const result = selectDistractors(target, pool, [], 2);
    expect(result.length).toBe(2); // relaxed category, still respects distance/homophone
  });

  it("never returns the target itself even if present in the pool", () => {
    const target = w(1, "cat", "noun");
    const pool = [target, w(2, "dog", "noun"), w(3, "bird", "noun")];
    const result = selectDistractors(target, pool, [], 2);
    expect(result.map((r) => r.word)).not.toContain("cat");
  });

  it("returns fewer than requested when the pool genuinely cannot supply enough safe candidates", () => {
    const target = w(1, "cat", "noun");
    const pool = [w(2, "bat", "noun")]; // distance 1 from "cat" — excluded
    const result = selectDistractors(target, pool, [], 3);
    expect(result.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/essential-words/__tests__/distractors.test.ts`
Expected: FAIL — cannot resolve `../distractors`.

- [ ] **Step 3: Write the implementation**

Create `lib/essential-words/distractors.ts`:

```ts
// Distractor selection policy (spec §2.4b). Pool-first: callers pass the
// words the learner has already seen (from useEssentialWordsSession.ts's
// distractorPool, or a larger dataset slice as fallback for early sessions)
// — this module only applies the safety filter, it does not decide where
// the candidate pool comes from.

import type { EssentialWord } from "./types";

/** Minimum edit distance a distractor must be from the target — excludes
 *  near-neighbors like be/he, to/do that would test spelling recognition
 *  rather than word knowledge. */
const MIN_DISTANCE = 2;

function editDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function isSafeDistance(target: string, candidate: string): boolean {
  return editDistance(target.toLowerCase(), candidate.toLowerCase()) >= MIN_DISTANCE;
}

/**
 * Selects up to `count` distractors for `target` from `pool`, applying (in
 * order, relaxing category first if the strict filter starves the result):
 *   1. never the target itself;
 *   2. never a known homophone (`homophones`, caller-supplied per target);
 *   3. minimum orthographic distance >= 2 from the target;
 *   4. same grammatical category as target (relaxed first if too few remain);
 *   5. deduped by lowercase surface form.
 *
 * Returns fewer than `count` (even zero) when the pool genuinely cannot
 * supply enough safe candidates — callers must handle a short result rather
 * than this function inventing unsafe distractors to fill the quota.
 */
export function selectDistractors(
  target: EssentialWord,
  pool: EssentialWord[],
  homophones: string[],
  count: number,
): EssentialWord[] {
  const homophoneSet = new Set(homophones.map((h) => h.toLowerCase()));
  const targetKey = target.word.toLowerCase();

  const base = pool.filter((w) => {
    const key = w.word.toLowerCase();
    if (key === targetKey) return false;
    if (homophoneSet.has(key)) return false;
    return isSafeDistance(target.word, w.word);
  });

  const dedupe = (candidates: EssentialWord[]): EssentialWord[] => {
    const seen = new Set<string>();
    const out: EssentialWord[] = [];
    for (const c of candidates) {
      const key = c.word.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
      if (out.length === count) break;
    }
    return out;
  };

  const sameCategory = base.filter((w) => w.pos === target.pos);
  const strict = dedupe(sameCategory);
  if (strict.length === count) return strict;

  // Relax category constraint before distance/homophone (spec §2.4b: "mejor
  // mezclar categorías que producir discriminación fina accidental").
  return dedupe(base);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/essential-words/__tests__/distractors.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/distractors.ts lib/essential-words/__tests__/distractors.test.ts
git commit -m "feat(essential-words): add distractor selection policy (spec §2.4b)"
```

---

### Task 5: `HintButton.tsx` — discrete, deferred-activation hint control

**Files:**
- Create: `components/practice/essential-words/HintButton.tsx`
- Test: `components/practice/essential-words/__tests__/HintButton.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/practice/essential-words/__tests__/HintButton.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { HintButton } from "../HintButton";
import type { HintRung } from "@/lib/essential-words/hint-ladder";

const ladder: HintRung[] = [
  { kind: "category", content: "adjetivo, 5 letras", priced: true, isGiveUp: false },
  { kind: "audio", content: "Escuchar la palabra", priced: true, isGiveUp: false },
  { kind: "reveal", content: "happy", priced: false, isGiveUp: true },
];

describe("HintButton", () => {
  it("is not rendered before the first failed attempt or idle timeout", () => {
    render(<HintButton ladder={ladder} hasFailedOnce={false} idleMs={0} onAdvance={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /pista/i })).not.toBeInTheDocument();
  });

  it("renders once hasFailedOnce is true", () => {
    render(<HintButton ladder={ladder} hasFailedOnce={true} idleMs={0} onAdvance={vi.fn()} />);
    expect(screen.getByRole("button", { name: /pista/i })).toBeInTheDocument();
  });

  it("clicking advances to the next rung and calls onAdvance with that rung", () => {
    const onAdvance = vi.fn();
    render(<HintButton ladder={ladder} hasFailedOnce={true} idleMs={0} onAdvance={onAdvance} />);
    fireEvent.click(screen.getByRole("button", { name: /pista/i }));
    expect(onAdvance).toHaveBeenCalledWith(ladder[0]);
    expect(screen.getByText("adjetivo, 5 letras")).toBeInTheDocument();
  });

  it("clicking again advances through subsequent rungs in order", () => {
    const onAdvance = vi.fn();
    render(<HintButton ladder={ladder} hasFailedOnce={true} idleMs={0} onAdvance={onAdvance} />);
    const button = screen.getByRole("button", { name: /pista/i });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onAdvance).toHaveBeenNthCalledWith(1, ladder[0]);
    expect(onAdvance).toHaveBeenNthCalledWith(2, ladder[1]);
  });

  it("does not advance past the last rung", () => {
    const onAdvance = vi.fn();
    render(<HintButton ladder={[ladder[0]]} hasFailedOnce={true} idleMs={0} onAdvance={onAdvance} />);
    const button = screen.getByRole("button", { name: /pista/i });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when the ladder is empty (multiple-choice modes have no hints)", () => {
    render(<HintButton ladder={[]} hasFailedOnce={true} idleMs={0} onAdvance={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("is discrete: not styled as a colored/primary action button", () => {
    render(<HintButton ladder={ladder} hasFailedOnce={true} idleMs={0} onAdvance={vi.fn()} />);
    const button = screen.getByRole("button", { name: /pista/i });
    expect(button.className).not.toMatch(/primary/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/practice/essential-words/__tests__/HintButton.test.tsx`
Expected: FAIL — cannot resolve `../HintButton`.

- [ ] **Step 3: Write the implementation**

Create `components/practice/essential-words/HintButton.tsx`:

```tsx
'use client'

// Planned structure:
// <HintButton>
//   <Trigger />       — discrete "¿Pista?" button, hidden until eligible
//   <RevealedRungs />  — content of every rung taken so far, in order
// </HintButton>

import { useState } from 'react'
import { cn } from '@/lib/cn'
import type { HintRung } from '@/lib/essential-words/hint-ladder'

interface Props {
  ladder: HintRung[]
  /** True once the learner has failed at least one attempt on this exercise,
   *  OR ~5s have passed with an empty input (spec §2.3 — the button doesn't
   *  exist before either condition, so it's never pressed by reflex). */
  hasFailedOnce: boolean
  /** Milliseconds of empty-input idle time observed by the caller — passed
   *  in rather than timed internally, since the caller (each card) already
   *  owns the input's value and is best placed to measure idle time against it. */
  idleMs: number
  onAdvance: (rung: HintRung) => void
}

const IDLE_THRESHOLD_MS = 5000

export function HintButton({ ladder, hasFailedOnce, idleMs, onAdvance }: Props) {
  const [rungIndex, setRungIndex] = useState(0)

  if (ladder.length === 0) return null
  const eligible = hasFailedOnce || idleMs >= IDLE_THRESHOLD_MS
  if (!eligible && rungIndex === 0) return null

  const revealed = ladder.slice(0, rungIndex)
  const hasMore = rungIndex < ladder.length

  const handleClick = () => {
    if (!hasMore) return
    onAdvance(ladder[rungIndex])
    setRungIndex((i) => i + 1)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {revealed.map((rung, i) => (
        <p key={i} className="m-0 text-caption text-fg-muted">
          {rung.content}
        </p>
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            'cursor-pointer border-none bg-transparent font-[inherit]',
            'text-caption text-fg-subtle underline focus-ring',
          )}
        >
          ¿Pista?
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/practice/essential-words/__tests__/HintButton.test.tsx`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add components/practice/essential-words/HintButton.tsx components/practice/essential-words/__tests__/HintButton.test.tsx
git commit -m "feat(essential-words): add HintButton — discrete, deferred-activation hint control"
```

---

### Task 6: `word-explanations.ts` + `AnswerDiff.tsx` — diff-based failure feedback

**Files:**
- Create: `lib/essential-words/word-explanations.ts`
- Create: `components/practice/essential-words/AnswerDiff.tsx`
- Test: `lib/essential-words/__tests__/word-explanations.test.ts`
- Test: `components/practice/essential-words/__tests__/AnswerDiff.test.tsx`

- [ ] **Step 1: Write the failing test for the explanation lookup**

Create `lib/essential-words/__tests__/word-explanations.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { explanationFor } from "../word-explanations";

describe("explanationFor — spec §2.5: only when a rule exists", () => {
  it("returns an explanation for 'be' (conjugation rule)", () => {
    expect(explanationFor("be")).toMatch(/am|is|are/i);
  });

  it("returns undefined for a word with no documented rule (most nouns)", () => {
    expect(explanationFor("elephant")).toBeUndefined();
  });

  it("is case-insensitive", () => {
    expect(explanationFor("Be")).toBe(explanationFor("be"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/essential-words/__tests__/word-explanations.test.ts`
Expected: FAIL — cannot resolve `../word-explanations`.

- [ ] **Step 3: Write the explanation lookup**

Create `lib/essential-words/word-explanations.ts`:

```ts
// Small closed lookup for the OPTIONAL "why" explanation shown on failure
// (spec §2.5, point 3: "explicar solo cuando hay regla"). Most words —
// especially concrete nouns — get no explanation, because there is nothing
// to explain; a generic message there is noise, not help. This table only
// grows when a word has a genuine grammatical rule worth stating in one
// short sentence.

const EXPLANATIONS: Record<string, string> = {
  be: "cambia a am / is / are según el sujeto",
  have: "cambia a has con he/she/it",
  do: "cambia a does con he/she/it",
  go: "cambia a goes con he/she/it",
};

/** Returns the explanation string for `word`, or undefined when none exists
 *  — callers must treat undefined as "show nothing", never a fallback message. */
export function explanationFor(word: string): string | undefined {
  return EXPLANATIONS[word.trim().toLowerCase()];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/essential-words/__tests__/word-explanations.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Write the failing test for `AnswerDiff`**

Create `components/practice/essential-words/__tests__/AnswerDiff.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnswerDiff } from "../AnswerDiff";

describe("AnswerDiff", () => {
  it("shows what was written and what was expected, not just the correct answer alone", () => {
    render(<AnswerDiff written="bi" expected="be" isTypo={false} word="be" />);
    expect(screen.getByText(/bi/)).toBeInTheDocument();
    expect(screen.getByText(/be/)).toBeInTheDocument();
  });

  it("shows a gentler message for a typo than for a genuine miss", () => {
    const { unmount } = render(<AnswerDiff written="hapy" expected="happy" isTypo={true} word="happy" />);
    const typoText = screen.getByTestId("answer-diff-message").textContent;
    unmount();
    render(<AnswerDiff written="sad" expected="happy" isTypo={false} word="happy" />);
    const missText = screen.getByTestId("answer-diff-message").textContent;
    expect(typoText).not.toBe(missText);
  });

  it("shows the explanation when one exists for the word", () => {
    render(<AnswerDiff written="am" expected="be" isTypo={false} word="be" />);
    expect(screen.getByText(/am \/ is \/ are/i)).toBeInTheDocument();
  });

  it("shows no explanation text when none exists for the word", () => {
    render(<AnswerDiff written="sad" expected="happy" isTypo={false} word="happy" />);
    expect(screen.queryByTestId("answer-diff-explanation")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run components/practice/essential-words/__tests__/AnswerDiff.test.tsx`
Expected: FAIL — cannot resolve `../AnswerDiff`.

- [ ] **Step 7: Write the implementation**

Create `components/practice/essential-words/AnswerDiff.tsx`:

```tsx
'use client'

// Planned structure:
// <AnswerDiff>
//   <WrittenVsExpected />  — "escribiste X, era Y"
//   <Explanation />         — only rendered when word-explanations.ts has one
// </AnswerDiff>

import { explanationFor } from '@/lib/essential-words/word-explanations'

interface Props {
  written: string
  expected: string
  isTypo: boolean
  /** The target word, used to look up an optional grammar explanation —
   *  distinct from `expected`, which may be a full sentence for dictation
   *  modes while `word` is always the single target vocabulary word. */
  word: string
}

export function AnswerDiff({ written, expected, isTypo, word }: Props) {
  const explanation = explanationFor(word)
  const message = isTypo
    ? `Casi — escribiste "${written}", revisa la ortografía de "${expected}".`
    : `Escribiste "${written}", la respuesta era "${expected}".`

  return (
    <div className="flex w-full flex-col items-center gap-1 text-center">
      <p data-testid="answer-diff-message" className="m-0 text-body text-fg">
        {message}
      </p>
      {explanation && (
        <p data-testid="answer-diff-explanation" className="m-0 text-caption text-fg-muted">
          {explanation}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run components/practice/essential-words/__tests__/AnswerDiff.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 9: Commit**

```bash
git add lib/essential-words/word-explanations.ts lib/essential-words/__tests__/word-explanations.test.ts components/practice/essential-words/AnswerDiff.tsx components/practice/essential-words/__tests__/AnswerDiff.test.tsx
git commit -m "feat(essential-words): add AnswerDiff feedback component and word-explanations lookup (spec §2.5)"
```

---

### Task 7: Migrate `DictationCard.tsx` to `AttemptOutcome`

**Files:**
- Modify: `components/practice/essential-words/DictationCard.tsx`
- Modify: `components/practice/essential-words/__tests__/DictationCard.test.tsx`

- [ ] **Step 1: Write the failing tests for the new behavior**

Read the existing `components/practice/essential-words/__tests__/DictationCard.test.tsx` first to see its current fixture/mock setup, then append (inside the existing `describe`) — do not remove the existing tests, since a card taking `repetitions` and rotating sentences (Fase A groundwork, already shipped) must keep working:

```tsx
import { attemptGrade } from "@/lib/essential-words/attempt-grade";

// ... inside the existing describe block:

it("calls onAttempt (not onGraded) with correct=true and hintsUsed=0 for a clean first-try answer", async () => {
  const onAttempt = vi.fn().mockResolvedValue(undefined);
  render(<DictationCard entry={entry} onAttempt={onAttempt} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "We walked through the park." } });
  fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
  expect(onAttempt).toHaveBeenCalledWith(
    expect.objectContaining({ correct: true, hintsUsed: 0, rescued: false }),
  );
});

it("treats a typo answer as correct without penalty (typo: true, correct: true)", async () => {
  const onAttempt = vi.fn().mockResolvedValue(undefined);
  render(<DictationCard entry={entry} onAttempt={onAttempt} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "We wlaked through the park." } }); // transposition typo of "walked"
  fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
  expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ typo: true, correct: true }));
});

it("audio replay via the hint ladder does not increment hintsUsed (dictation audio is free, spec §2.3)", async () => {
  const onAttempt = vi.fn().mockResolvedValue(undefined);
  render(<DictationCard entry={entry} onAttempt={onAttempt} />);
  fireEvent.click(screen.getByRole("button", { name: /escuchar de nuevo/i }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "We walked through the park." } });
  fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
  expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ hintsUsed: 0 }));
});

it("records latencyMs on the outcome", async () => {
  const onAttempt = vi.fn().mockResolvedValue(undefined);
  render(<DictationCard entry={entry} onAttempt={onAttempt} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "We walked through the park." } });
  fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
  const call = onAttempt.mock.calls[0][0];
  expect(typeof call.latencyMs).toBe("number");
  expect(call.latencyMs).toBeGreaterThanOrEqual(0);
});

it("shows AnswerDiff feedback on a wrong (non-typo) answer instead of only revealing the sentence", async () => {
  const onAttempt = vi.fn().mockResolvedValue(undefined);
  render(<DictationCard entry={entry} onAttempt={onAttempt} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "totally wrong" } });
  fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
  expect(screen.getByTestId("answer-diff-message")).toBeInTheDocument();
});
```

> Check the existing test file's `entry` fixture value for the exact sentence text used (`"We walked through the park."` was the value shown in the file at planning time — verify it matches before running, and use the file's actual fixture, not this snippet's copy, if they differ).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/practice/essential-words/__tests__/DictationCard.test.tsx`
Expected: FAIL — `onAttempt` prop doesn't exist yet; `AnswerDiff`/hint ladder aren't wired in.

- [ ] **Step 3: Migrate the implementation**

Modify `components/practice/essential-words/DictationCard.tsx` — replace its full contents:

```tsx
'use client'

// Planned structure:
// <DictationCard>
//   <ListenButton />
//   <AnswerInput />
//   <HintButton />
//   <AnswerDiff | Reveal />
// </DictationCard>

import { useRef, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { PillButton } from '@/components/ui/PillButton'
import { ListenButton } from '@/components/ui/ListenButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { selectSentence } from '@/lib/essential-words/sentence-variants'
import { attemptGrade, gradeToLegacyQuality, type AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import { buildHintLadder } from '@/lib/essential-words/hint-ladder'
import { isTypo } from '@/lib/essential-words/typo'
import { HintButton } from './HintButton'
import { AnswerDiff } from './AnswerDiff'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
  /** SM-2 repetition count — rotates which example sentence is dictated. */
  repetitions?: number
}

/** Compare ignoring case, punctuation, and repeated whitespace. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function DictationCard({ entry, onAttempt, repetitions = 0 }: Props) {
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [outcome, setOutcome] = useState<{ correct: boolean; typo: boolean } | null>(null)
  const hintsUsedRef = useRef(0)
  const firstTryFailedRef = useRef(false)
  const startedAtRef = useRef(Date.now())
  const { sentence } = selectSentence(entry, repetitions)
  const ladder = buildHintLadder(entry, 'dictation_sentence')

  const handleCheck = () => {
    if (revealed || answer.trim() === '') return
    const isExact = normalize(answer) === normalize(sentence)
    const typo = !isExact && isTypo(normalize(answer), normalize(sentence))
    const correct = isExact || typo

    if (!correct && !firstTryFailedRef.current) {
      // First failure: reveal feedback, but don't grade yet — the learner
      // gets one ungraded retry (spec §2.2: only the FIRST graded attempt
      // fixes the grade; a retry after feedback is a repair, not a new attempt).
      firstTryFailedRef.current = true
      setOutcome({ correct: false, typo: false })
      setRevealed(true)
      playUiCue('wrong')
      return
    }

    setRevealed(true)
    playUiCue(correct ? 'correct' : 'wrong')
    const finalOutcome: AttemptOutcome = {
      correct,
      hintsUsed: hintsUsedRef.current,
      rescued: false,
      typo,
      firstTryFailed: firstTryFailedRef.current && correct,
      latencyMs: Date.now() - startedAtRef.current,
    }
    setOutcome({ correct, typo })
    void onAttempt(finalOutcome)
    void attemptGrade // referenced for type-flow clarity; grade itself is derived by the caller via gradeToLegacyQuality where needed
  }

  const handleRepair = () => {
    setRevealed(false)
    setOutcome(null)
    setAnswer('')
  }

  return (
    <div className="flex w-full flex-col items-center gap-[var(--space-5)] rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <p className="font-kicker m-0 text-fg-muted">Escucha y escribe la oración</p>

      <ListenButton
        onPlay={() => speak(sentence, { rate: 0.95 })}
        label="Escuchar de nuevo"
      />

      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
        disabled={revealed}
        aria-label="Escribe lo que escuchaste"
        className="w-full max-w-sm rounded-md border border-border-subtle bg-surface px-3 py-2 text-body text-fg focus-ring"
      />

      {!revealed && (
        <HintButton
          ladder={ladder}
          hasFailedOnce={firstTryFailedRef.current}
          idleMs={0}
          onAdvance={(rung) => {
            if (rung.priced) hintsUsedRef.current += 1
          }}
        />
      )}

      {revealed && outcome && !outcome.correct && firstTryFailedRef.current && !outcome.typo ? (
        <>
          <AnswerDiff written={answer} expected={sentence} isTypo={false} word={entry.word} />
          <PillButton type="button" variant="outline" size="sm" onClick={handleRepair}>
            Intentar de nuevo
          </PillButton>
        </>
      ) : revealed ? (
        <p className="m-0 max-w-[42ch] text-center text-body-lg text-fg">
          {sentence}
        </p>
      ) : (
        <PillButton type="button" variant="primary" onClick={handleCheck}>
          Comprobar
        </PillButton>
      )}
    </div>
  )
}
```

> The `void attemptGrade` line is a deliberate no-op reference so the import isn't flagged unused — `DictationCard` doesn't call `attemptGrade` directly (grading happens one layer up, in `EssentialWordsSession.tsx`, Task 11, which receives the raw `AttemptOutcome` via `onAttempt` and is the single place that calls `attemptGrade` + `gradeToLegacyQuality` before handing a quality number to the unchanged Fase A hook). **Remove the unused `attemptGrade`/`gradeToLegacyQuality` imports from this file** if ESLint flags them after Step 4 — they were listed here only to make the intended data flow explicit; the card's actual job is building `AttemptOutcome` and calling `onAttempt`, nothing more.

- [ ] **Step 4: Run test to verify it passes, then remove unused imports**

Run: `npx vitest run components/practice/essential-words/__tests__/DictationCard.test.tsx`
Expected: PASS, both original and new tests.

Run: `npx eslint components/practice/essential-words/DictationCard.tsx`
If `attemptGrade`/`gradeToLegacyQuality` are flagged unused, remove those two imports and the `void attemptGrade` line — the card does not need them (see note above).

- [ ] **Step 5: Type-check**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add components/practice/essential-words/DictationCard.tsx components/practice/essential-words/__tests__/DictationCard.test.tsx
git commit -m "feat(essential-words): migrate DictationCard to AttemptOutcome, add hints and diff feedback"
```

---

### Task 8: Migrate `ClozeCard.tsx` to `AttemptOutcome`

**Files:**
- Modify: `components/practice/essential-words/ClozeCard.tsx`
- Modify: `components/practice/essential-words/__tests__/ClozeCard.test.tsx`

Same pattern as Task 7, with two differences: (1) the hint ladder's audio rung is **priced** here (cloze's audio is not the prompt — the written sentence is), and (2) the diff compares against the single missing word, not a full sentence.

- [ ] **Step 1: Write the failing tests**

Read the existing `ClozeCard.test.tsx` fixture first, then append:

```tsx
it("calls onAttempt with correct=true, hintsUsed=0 for a clean answer", async () => {
  const onAttempt = vi.fn().mockResolvedValue(undefined);
  render(<ClozeCard entry={entry} onAttempt={onAttempt} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: entry.word } });
  fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
  expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ correct: true, hintsUsed: 0 }));
});

it("cloze's optional audio hint IS priced (it is not the prompt — spec §2.3)", async () => {
  const onAttempt = vi.fn().mockResolvedValue(undefined);
  render(<ClozeCard entry={entry} onAttempt={onAttempt} />);
  fireEvent.click(screen.getByRole("button", { name: /pista/i })); // category rung, priced
  fireEvent.change(screen.getByRole("textbox"), { target: { value: entry.word } });
  fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
  expect(onAttempt.mock.calls[0][0].hintsUsed).toBeGreaterThan(0);
});

it("wrong answer shows AnswerDiff, not just the revealed sentence", async () => {
  const onAttempt = vi.fn().mockResolvedValue(undefined);
  render(<ClozeCard entry={entry} onAttempt={onAttempt} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "wrongword" } });
  fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
  expect(screen.getByTestId("answer-diff-message")).toBeInTheDocument();
});
```

> The HintButton in this card only becomes visible after `hasFailedOnce` per Task 7's pattern — if the "priced" test above needs the button visible before a fail to click it, wire `HintButton`'s `hasFailedOnce` prop from a local ref that Task 7's card also uses, OR adjust the test to fail once first, then use the hint — follow whichever matches Task 7's actual committed behavior exactly, since both cards must be consistent (see Task 7 Step 3 for the reference pattern: the hint button is offered starting at first fail, not before).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/practice/essential-words/__tests__/ClozeCard.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Migrate the implementation**

Modify `components/practice/essential-words/ClozeCard.tsx` — replace its full contents, following Task 7's exact pattern (first-fail-then-repair flow, `hintsUsedRef`, `startedAtRef`) but sourced from `cloze.ts`'s `clozeFor` and grading against `cloze.answer`:

```tsx
'use client'

// Planned structure:
// <ClozeCard>
//   <Prompt />        — kicker + oración con hueco + pista (traducción)
//   <AnswerInput />
//   <HintButton />
//   <AnswerDiff | Reveal />
// </ClozeCard>

import { useRef, useState } from 'react'
import { PillButton } from '@/components/ui/PillButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { clozeFor } from '@/lib/essential-words/cloze'
import { selectSentence } from '@/lib/essential-words/sentence-variants'
import { buildHintLadder } from '@/lib/essential-words/hint-ladder'
import { isTypo } from '@/lib/essential-words/typo'
import { HintButton } from './HintButton'
import { AnswerDiff } from './AnswerDiff'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
  /** SM-2 repetition count — rotates which example sentence is blanked. */
  repetitions?: number
}

/** Compare ignoring case and punctuation. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9']/g, '').trim()
}

export function ClozeCard({ entry, onAttempt, repetitions = 0 }: Props) {
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [outcome, setOutcome] = useState<{ correct: boolean; typo: boolean } | null>(null)
  const hintsUsedRef = useRef(0)
  const firstTryFailedRef = useRef(false)
  const startedAtRef = useRef(Date.now())
  const { sentence } = selectSentence(entry, repetitions)
  const cloze = clozeFor(entry, sentence)
  const ladder = buildHintLadder(entry, 'cloze_sentence')

  const handleCheck = () => {
    if (revealed || answer.trim() === '' || !cloze) return
    const given = normalize(answer)
    const isExact = given === normalize(cloze.answer) || given === normalize(entry.word)
    const typo = !isExact && isTypo(given, normalize(cloze.answer))
    const correct = isExact || typo

    if (!correct && !firstTryFailedRef.current) {
      firstTryFailedRef.current = true
      setOutcome({ correct: false, typo: false })
      setRevealed(true)
      playUiCue('wrong')
      return
    }

    setRevealed(true)
    playUiCue(correct ? 'correct' : 'wrong')
    setOutcome({ correct, typo })
    void onAttempt({
      correct,
      hintsUsed: hintsUsedRef.current,
      rescued: false,
      typo,
      firstTryFailed: firstTryFailedRef.current && correct,
      latencyMs: Date.now() - startedAtRef.current,
    })
  }

  const handleRepair = () => {
    setRevealed(false)
    setOutcome(null)
    setAnswer('')
  }

  if (!cloze) return null

  return (
    <div className="flex w-full flex-col items-center gap-[var(--space-5)] rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <p className="font-kicker m-0 text-fg-muted">Completa la oración</p>

      <p className="m-0 max-w-[42ch] text-center text-body-lg text-fg">{cloze.blanked}</p>

      {entry.translation && (
        <p className="m-0 text-body text-fg-muted">Pista: {entry.translation}</p>
      )}

      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
        disabled={revealed}
        aria-label="Escribe la palabra que falta"
        className="w-full max-w-sm rounded-md border border-border-subtle bg-surface px-3 py-2 text-body text-fg focus-ring"
      />

      {!revealed && (
        <HintButton
          ladder={ladder}
          hasFailedOnce={firstTryFailedRef.current}
          idleMs={0}
          onAdvance={(rung) => {
            if (rung.priced) hintsUsedRef.current += 1
          }}
        />
      )}

      {revealed && outcome && !outcome.correct && firstTryFailedRef.current && !outcome.typo ? (
        <>
          <AnswerDiff written={answer} expected={cloze.answer} isTypo={false} word={entry.word} />
          <PillButton type="button" variant="outline" size="sm" onClick={handleRepair}>
            Intentar de nuevo
          </PillButton>
        </>
      ) : revealed ? (
        <p className="m-0 max-w-[42ch] text-center text-body-lg text-fg">
          {sentence}
        </p>
      ) : (
        <PillButton type="button" variant="primary" onClick={handleCheck}>
          Comprobar
        </PillButton>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/practice/essential-words/__tests__/ClozeCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Type-check and lint**

Run: `pnpm type-check`
Run: `npx eslint components/practice/essential-words/ClozeCard.tsx`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add components/practice/essential-words/ClozeCard.tsx components/practice/essential-words/__tests__/ClozeCard.test.tsx
git commit -m "feat(essential-words): migrate ClozeCard to AttemptOutcome, priced audio hint"
```

---

### Task 9: Migrate `RecognizeCard.tsx` and `RecognizeAudioCard.tsx` — `onAttempt`, `distractors.ts`, no hints

**Files:**
- Modify: `components/practice/essential-words/RecognizeCard.tsx`
- Modify: `components/practice/essential-words/__tests__/RecognizeCard.test.tsx`
- Modify: `components/practice/essential-words/RecognizeAudioCard.tsx`
- Modify: `components/practice/essential-words/__tests__/RecognizeAudioCard.test.tsx`

Both cards are multiple-choice — no hints (§2.3: "opción múltiple: sin pistas"). This task's real work is `onAttempt` + swapping the inline distractor `useMemo` for `selectDistractors`.

- [ ] **Step 1: Read `RecognizeAudioCard.tsx` in full first**

Run: (read the file directly, do not assume its shape) — confirm whether it already uses `useMemo` distractor logic identical to `RecognizeCard.tsx`'s, or a variant. This plan's Step 3 below assumes it mirrors `RecognizeCard.tsx`'s pattern (confirmed in prior research); if it materially differs, adapt Step 3's edit accordingly rather than pattern-matching blindly.

- [ ] **Step 2: Write the failing tests for `RecognizeCard`**

Append to `components/practice/essential-words/__tests__/RecognizeCard.test.tsx` (after reading its current fixtures):

```tsx
it("calls onAttempt (not onGraded) with correct=true and hintsUsed=0 always (no hints on recognize)", async () => {
  const onAttempt = vi.fn().mockResolvedValue(undefined);
  render(
    <RecognizeCard entry={word()} prompt="a través de" distractors={distractors} onAttempt={onAttempt} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "through" }));
  expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ correct: true, hintsUsed: 0 }));
});

it("calls onAttempt with correct=false and rescued=false for a wrong pick (this IS the primary attempt, not a rescue)", async () => {
  const onAttempt = vi.fn().mockResolvedValue(undefined);
  render(
    <RecognizeCard entry={word()} prompt="a través de" distractors={distractors} onAttempt={onAttempt} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "under" }));
  expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({ correct: false, rescued: false }));
});

it("records latencyMs", async () => {
  const onAttempt = vi.fn().mockResolvedValue(undefined);
  render(
    <RecognizeCard entry={word()} prompt="a través de" distractors={distractors} onAttempt={onAttempt} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "through" }));
  expect(typeof onAttempt.mock.calls[0][0].latencyMs).toBe("number");
});
```

- [ ] **Step 3: Run to verify it fails, then migrate `RecognizeCard.tsx`**

Run: `npx vitest run components/practice/essential-words/__tests__/RecognizeCard.test.tsx`
Expected: FAIL.

Replace `components/practice/essential-words/RecognizeCard.tsx`'s full contents:

```tsx
'use client'

// Planned structure:
// <RecognizeCard>
//   <Prompt />
//   <OptionGrid />
// </RecognizeCard>

import { useMemo, useRef, useState } from 'react'
import { PillButton } from '@/components/ui/PillButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'
import { selectDistractors } from '@/lib/essential-words/distractors'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  /** Translation or meaning — whichever mode selected this card. */
  prompt: string
  /** Words the learner has already seen this session — the distractor pool. */
  distractors: EssentialWord[]
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
}

const OPTION_COUNT = 4

export function RecognizeCard({ entry, prompt, distractors, onAttempt }: Props) {
  const [chosen, setChosen] = useState<string | null>(null)
  const startedAtRef = useRef(Date.now())

  const options = useMemo(() => {
    const wrong = selectDistractors(entry, distractors, [], OPTION_COUNT - 1)
    const all = [entry, ...wrong].map((w) => w.word)
    return all.sort(() => Math.random() - 0.5)
  }, [entry, distractors])

  const handleChoose = (choice: string) => {
    if (chosen) return
    setChosen(choice)
    const isCorrect = choice.toLowerCase() === entry.word.toLowerCase()
    playUiCue(isCorrect ? 'correct' : 'wrong')
    void onAttempt({
      correct: isCorrect,
      hintsUsed: 0, // spec §2.3: multiple choice never offers hints
      rescued: false,
      typo: false,
      firstTryFailed: false,
      latencyMs: Date.now() - startedAtRef.current,
    })
  }

  return (
    <div className="flex w-full flex-col items-center gap-[var(--space-5)] rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <div className="flex max-w-[42ch] flex-col items-center gap-1 text-center">
        <p className="font-kicker m-0 text-fg-muted">¿Qué palabra es?</p>
        <p className="m-0 text-body-lg font-medium leading-relaxed text-balance text-fg">
          {prompt}
        </p>
      </div>

      <div className="grid w-full max-w-sm grid-cols-2 gap-2">
        {options.map((option) => (
          <PillButton
            key={option}
            type="button"
            variant={chosen === option ? 'primary' : 'outline'}
            onClick={() => handleChoose(option)}
            disabled={Boolean(chosen)}
            className={cn(
              chosen &&
                option.toLowerCase() === entry.word.toLowerCase() &&
                'bg-success hover:bg-success',
            )}
          >
            {option}
          </PillButton>
        ))}
      </div>
    </div>
  )
}
```

> Note: this swaps the old dedupe-only `useMemo` for `selectDistractors`, which already dedupes and additionally filters by category/distance/homophone. `selectDistractors` may return fewer than `OPTION_COUNT - 1` distractors when the pool is thin — verify the existing options-count test in `RecognizeCard.test.tsx` (if any) still holds with a realistic-sized `distractors` fixture, and if the test's fixture pool is too small to yield 3 safe distractors under the new policy, enlarge the fixture pool in the test rather than loosening `selectDistractors`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/practice/essential-words/__tests__/RecognizeCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Repeat Steps 2–4 for `RecognizeAudioCard.tsx`**

Apply the identical migration pattern (verified against the file read in Step 1) to `RecognizeAudioCard.tsx` and its test file: `onGraded` → `onAttempt`, inline distractor logic → `selectDistractors`, `hintsUsed: 0` always, `latencyMs` tracked via `startedAtRef`. Write the equivalent failing tests first in `RecognizeAudioCard.test.tsx`, confirm they fail, then migrate the component, then confirm green.

- [ ] **Step 6: Type-check and lint both files**

Run: `pnpm type-check`
Run: `npx eslint components/practice/essential-words/RecognizeCard.tsx components/practice/essential-words/RecognizeAudioCard.tsx`
Expected: both exit 0.

- [ ] **Step 7: Commit**

```bash
git add components/practice/essential-words/RecognizeCard.tsx components/practice/essential-words/__tests__/RecognizeCard.test.tsx components/practice/essential-words/RecognizeAudioCard.tsx components/practice/essential-words/__tests__/RecognizeAudioCard.test.tsx
git commit -m "feat(essential-words): migrate RecognizeCard/RecognizeAudioCard to AttemptOutcome and distractors.ts policy"
```

---

### Task 10: Migrate `RecallTranslationCard.tsx` and `WeakFormCard.tsx`

**Files:**
- Modify: `components/practice/essential-words/RecallTranslationCard.tsx`
- Modify: `components/practice/essential-words/__tests__/RecallTranslationCard.test.tsx`
- Modify: `components/practice/essential-words/WeakFormCard.tsx`
- Modify: `components/practice/essential-words/__tests__/WeakFormCard.test.tsx`

`RecallTranslationCard` gets the full hint-ladder treatment (typed answer, level 2, priced audio per spec §2.3's audio-cost rule — the enunciado is the Spanish prompt, not audio). `WeakFormCard` is a self-graded card (buttons, not typed input) that stays out of the first-encounter flow per spec §1.5 — this task only migrates its grading-contract signature to `onAttempt` for consistency; it does not add a hint ladder (there's nothing to hint at in a self-graded exercise).

- [ ] **Step 1: Write the failing tests for `RecallTranslationCard`**

Read the existing test file's fixtures first, then follow Task 7/8's pattern exactly: `onAttempt` instead of `onGraded`, `hintsUsedRef`/`firstTryFailedRef`/`startedAtRef`, `isTypo` check, `AnswerDiff` on genuine miss, `buildHintLadder(entry, 'recall_translation')` (priced audio).

- [ ] **Step 2: Run to verify it fails, then migrate `RecallTranslationCard.tsx`**

Run: `npx vitest run components/practice/essential-words/__tests__/RecallTranslationCard.test.tsx`
Expected: FAIL.

Apply Task 8's exact migration pattern (ClozeCard is the closer template since both grade a single typed word, not a full sentence) to `RecallTranslationCard.tsx`, sourcing the ladder as `buildHintLadder(entry, 'recall_translation')` and comparing the typed answer against `entry.translation` (read the file first to confirm the exact existing comparison logic before changing it — preserve whatever normalization it already does beyond what this plan shows).

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run components/practice/essential-words/__tests__/RecallTranslationCard.test.tsx`
Expected: PASS.

- [ ] **Step 4: Write the failing test for `WeakFormCard`**

Read the existing `WeakFormCard.test.tsx` and `WeakFormCard.tsx` first (self-graded: buttons like "Lo dije bien" / "No estoy seguro", not typed input — confirm this shape before writing tests). Append a signature-migration test:

```tsx
it("calls onAttempt (not onGraded) when self-graded as correct", async () => {
  const onAttempt = vi.fn().mockResolvedValue(undefined);
  render(<WeakFormCard entry={entry} onAttempt={onAttempt} />);
  fireEvent.click(screen.getByRole("button", { name: /lo dije bien/i }));
  expect(onAttempt).toHaveBeenCalledWith(
    expect.objectContaining({ correct: true, hintsUsed: 0, rescued: false, typo: false }),
  );
});
```

- [ ] **Step 5: Run to verify it fails, then migrate `WeakFormCard.tsx`**

Run: `npx vitest run components/practice/essential-words/__tests__/WeakFormCard.test.tsx`
Expected: FAIL.

Modify `WeakFormCard.tsx`: change the `onGraded: (quality: number) => Promise<void>` prop to `onAttempt: (outcome: AttemptOutcome) => Promise<void>`, and at each self-grade button's click handler, replace the `onGraded(5)` / `onGraded(2)`-style call (read the file to confirm the exact existing quality values used) with an `AttemptOutcome` build: `{ correct: <true for "lo dije bien", false otherwise>, hintsUsed: 0, rescued: false, typo: false, firstTryFailed: false, latencyMs: Date.now() - startedAtRef.current }`, adding a `startedAtRef` the same way the other migrated cards do.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run components/practice/essential-words/__tests__/WeakFormCard.test.tsx`
Expected: PASS.

- [ ] **Step 7: Type-check and lint**

Run: `pnpm type-check`
Run: `npx eslint components/practice/essential-words/RecallTranslationCard.tsx components/practice/essential-words/WeakFormCard.tsx`
Expected: both exit 0.

- [ ] **Step 8: Commit**

```bash
git add components/practice/essential-words/RecallTranslationCard.tsx components/practice/essential-words/__tests__/RecallTranslationCard.test.tsx components/practice/essential-words/WeakFormCard.tsx components/practice/essential-words/__tests__/WeakFormCard.test.tsx
git commit -m "feat(essential-words): migrate RecallTranslationCard and WeakFormCard to AttemptOutcome"
```

---

### Task 11: Migrate `SpeakReviewCard.tsx` — the size-constrained, richer-signature card

**Files:**
- Modify: `components/practice/essential-words/SpeakReviewCard.tsx`
- Create: `components/practice/essential-words/useSpeakOutcome.ts` (extraction, to stay under the line-count convention)
- Modify: `components/practice/essential-words/__tests__/SpeakReviewCard.test.tsx`

`SpeakReviewCard.tsx` is already 296 lines — over the 250-line convention and at the ESLint 300-line warning. Its `onGraded` signature already differs from every other card (`(quality: number, extras?: { accuracy; transcript }) => Promise<void>`), because it has both a speech-scoring path (mic) and a self-grade fallback path (no mic). Adding `AttemptOutcome`-building logic inline would push it well past 300 — extract the outcome-construction logic into a small colocated hook first.

- [ ] **Step 1: Write the failing test for the extracted hook**

Create `components/practice/essential-words/__tests__/useSpeakOutcome.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildSpeakOutcome } from "../useSpeakOutcome";

describe("buildSpeakOutcome — bridges speech-scoring/self-grade paths to AttemptOutcome", () => {
  it("builds a correct outcome from a high accuracy score", () => {
    const outcome = buildSpeakOutcome({ accuracy: 92, startedAt: Date.now() - 3000 });
    expect(outcome.correct).toBe(true);
    expect(outcome.hintsUsed).toBe(0);
    expect(outcome.rescued).toBe(false);
    expect(outcome.typo).toBe(false);
    expect(outcome.latencyMs).toBeGreaterThanOrEqual(2900);
  });

  it("builds an incorrect outcome from a low accuracy score", () => {
    const outcome = buildSpeakOutcome({ accuracy: 30, startedAt: Date.now() });
    expect(outcome.correct).toBe(false);
  });

  it("builds an outcome from a manual self-grade (no mic available) — quality >= 3 counts as correct", () => {
    const outcome = buildSpeakOutcome({ selfGradeQuality: 4, startedAt: Date.now() });
    expect(outcome.correct).toBe(true);
  });

  it("a self-grade below 3 is incorrect", () => {
    const outcome = buildSpeakOutcome({ selfGradeQuality: 2, startedAt: Date.now() });
    expect(outcome.correct).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/practice/essential-words/__tests__/useSpeakOutcome.test.ts`
Expected: FAIL — cannot resolve `../useSpeakOutcome`.

- [ ] **Step 3: Write the extracted module**

Create `components/practice/essential-words/useSpeakOutcome.ts`:

```ts
// Extracted from SpeakReviewCard.tsx to keep that file under the project's
// line-count convention. Bridges its two existing grading paths (speech
// accuracy scoring, and the mic-unavailable self-grade fallback) into a
// single AttemptOutcome — speak_sentence has no hint ladder or typo concept
// (spoken input isn't compared character-by-character), so this is a pure
// mapping, not a stateful hook despite the filename's `use` prefix (kept for
// naming symmetry with the card's other collaborators; it holds no state).

import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'

interface SpeakScoreInput {
  accuracy: number
  startedAt: number
}
interface SelfGradeInput {
  selfGradeQuality: number
  startedAt: number
}

const SELF_GRADE_PASS_THRESHOLD = 3
const ACCURACY_PASS_THRESHOLD = 70

export function buildSpeakOutcome(input: SpeakScoreInput | SelfGradeInput): AttemptOutcome {
  const latencyMs = Date.now() - input.startedAt
  const correct = 'accuracy' in input
    ? input.accuracy >= ACCURACY_PASS_THRESHOLD
    : input.selfGradeQuality >= SELF_GRADE_PASS_THRESHOLD

  return {
    correct,
    hintsUsed: 0, // speak_sentence has no hint ladder (spec §1.5: opcional, requiere mic ya concedido)
    rescued: false,
    typo: false,
    firstTryFailed: false,
    latencyMs,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/practice/essential-words/__tests__/useSpeakOutcome.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit the extracted module separately**

```bash
git add components/practice/essential-words/useSpeakOutcome.ts components/practice/essential-words/__tests__/useSpeakOutcome.test.ts
git commit -m "feat(essential-words): extract buildSpeakOutcome to keep SpeakReviewCard under the line-count convention"
```

- [ ] **Step 6: Write the failing test for the card's new prop**

Append to `components/practice/essential-words/__tests__/SpeakReviewCard.test.tsx` (read its existing setup first — it mocks `useSpeechInput`/`useSharedMicStream`/`defaultEvaluationEngine`, follow that exact pattern):

```tsx
it("calls onAttempt (not onGraded) with an AttemptOutcome after a scored speech attempt", async () => {
  const onAttempt = vi.fn().mockResolvedValue(undefined);
  // Follow the existing test file's pattern for driving state to 'scored' via
  // the mocked useSpeechInput/defaultEvaluationEngine before asserting.
  render(<SpeakReviewCard entry={entry} onAttempt={onAttempt} onArchive={vi.fn()} />);
  // ... existing test file's established flow to reach the scored state ...
  fireEvent.click(screen.getByRole("button", { name: /guardar y ver la siguiente/i }));
  expect(onAttempt).toHaveBeenCalledWith(
    expect.objectContaining({ hintsUsed: 0, rescued: false, typo: false }),
  );
});

it("self-grade fallback (no mic) also calls onAttempt with a valid AttemptOutcome", async () => {
  const onAttempt = vi.fn().mockResolvedValue(undefined);
  // Follow the existing file's pattern for forcing the useFallback branch
  // (isSupported: false from the mocked useSpeechInput).
  render(<SpeakReviewCard entry={entry} onAttempt={onAttempt} onArchive={vi.fn()} />);
  // ... existing established self-grade flow ...
});
```

> The two tests above are written against the established mocking pattern already in the file rather than reproduced in full here, since the exact mock shape (return values of `useSpeechInput`, `defaultEvaluationEngine.evaluate`) must match what Step 1 of this task's implementer reads directly from the current test file — copying a guessed mock shape risks silently testing nothing. Read the file, then complete these two test bodies using its exact existing helpers before proceeding to Step 7.

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run components/practice/essential-words/__tests__/SpeakReviewCard.test.tsx`
Expected: FAIL — `onAttempt` prop doesn't exist yet.

- [ ] **Step 8: Migrate the implementation**

In `components/practice/essential-words/SpeakReviewCard.tsx`:

1. Change the import block to add:
```tsx
import { buildSpeakOutcome } from './useSpeakOutcome'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
```

2. Change the `Props` interface's `onGraded` line:
```tsx
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
```
(remove the old `onGraded: (quality: number, extras?: { accuracy: number; transcript: string }) => Promise<void>` line entirely)

3. Add a `startedAtRef` alongside the existing refs (`submitted`):
```tsx
  const startedAtRef = useRef(Date.now())
```
and reset it in the existing `useEffect` that resets `submitted.current`/`scored`/etc. on `entry.rank` change (add `startedAtRef.current = Date.now()` to that effect's body).

4. Replace `handleContinue`'s body:
```tsx
  const handleContinue = () => {
    if (!scored || submitted.current) return
    submitted.current = true
    setSubmitError(null)
    setIsSubmitting(true)
    void onAttempt(buildSpeakOutcome({ accuracy: scored.score, startedAt: startedAtRef.current }))
      .catch(() => {
        submitted.current = false
        setSubmitError('No se pudo guardar este resultado. Intenta de nuevo.')
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }
```

5. Replace `handleSelfGrade`'s body:
```tsx
  const handleSelfGrade = (quality: number) => {
    if (submitted.current) return
    submitted.current = true
    setSubmitError(null)
    setIsSubmitting(true)
    void onAttempt(buildSpeakOutcome({ selfGradeQuality: quality, startedAt: startedAtRef.current }))
      .catch(() => {
        submitted.current = false
        setSubmitError('No se pudo guardar este resultado. Intenta de nuevo.')
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }
```

Everything else in the file (mic handling, evaluation, `SelfGradeBar`, `QuietSpeakFeedback`, `PhonemeFeedbackTable`, `SpeakSkipActions`, all rendering) stays untouched.

- [ ] **Step 9: Run test to verify it passes**

Run: `npx vitest run components/practice/essential-words/__tests__/SpeakReviewCard.test.tsx`
Expected: PASS.

- [ ] **Step 10: Confirm the file did not grow past the convention**

Run:
```bash
wc -l components/practice/essential-words/SpeakReviewCard.tsx
```
Expected: still under 300 (the swap removed the old `accuracyToQuality`/inline-object-building code and replaced it with a single `buildSpeakOutcome(...)` call, so the file should shrink slightly, not grow). If it exceeds 300, extract further (e.g. move the mic/scoring `useEffect` block into a small `useSpeakScoring` hook) before committing.

- [ ] **Step 11: Type-check and lint**

Run: `pnpm type-check`
Run: `npx eslint components/practice/essential-words/SpeakReviewCard.tsx`
Expected: both exit 0.

- [ ] **Step 12: Commit**

```bash
git add components/practice/essential-words/SpeakReviewCard.tsx components/practice/essential-words/__tests__/SpeakReviewCard.test.tsx
git commit -m "feat(essential-words): migrate SpeakReviewCard to AttemptOutcome via buildSpeakOutcome"
```

---

### Task 12: Wire `onAttempt` through `EssentialWordsSession.tsx` and flip the level-3 flag

**Files:**
- Modify: `components/practice/essential-words/EssentialWordsSession.tsx`
- Modify: `components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx`

This is the task that connects every migrated card's `onAttempt` to the (unchanged) Fase A hook's numeric `submitGrade`, via `attemptGrade` + `gradeToLegacyQuality` — and flips the level-3 flag now that hints/feedback exist.

- [ ] **Step 1: Read `EssentialWordsSession.tsx` in full and confirm which prop each card currently receives**

Every card in this file currently receives `onGraded={submitGrade}` (Fase A's hook already exposes `submitGrade: (quality: number, extras?: GradeExtras) => Promise<void>`, unchanged by this plan). Confirm the exact prop wiring for each of the 8 cards before editing — do not assume; read the file directly.

- [ ] **Step 2: Write the failing test**

Append to `components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx` (follow the file's existing mock/fixture setup exactly):

```tsx
it('grades a Recognize attempt through attemptGrade — a correct choice results in a passing quality write', async () => {
  dbMocks.getEssentialWordsSrsEntries.mockResolvedValue([/* seed a due review at the tender tier, per the file's existing pattern for reaching a recognize card */])
  dbMocks.getEssentialWordsIntroducedToday.mockResolvedValue(Array.from({ length: 10 }, (_, i) => `w${i}`))

  render(<EssentialWordsSession />)
  // ... follow the file's established pattern to reach a RecognizeCard, click
  // the correct option, and assert dbMocks.saveSRSData (or whatever the file's
  // existing grading-assertion helper is) was called with a quality >= 4
  // (Easy/Good — a clean, hintless, correct multiple-choice pick should never
  // grade below Good under attemptGrade's rules).
})
```

> This test is sketched against the file's established fixture/mock conventions rather than fully inlined, since the exact seed shape for "reach a recognize card" must match the file's real `WORDS`/`dbMocks` fixtures — read the file first and complete this test using its actual helpers before running it.

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx`
Expected: FAIL — cards still call `onGraded` directly with a hardcoded quality, bypassing `attemptGrade` entirely (the test's assertion on the *value* of the graded quality, not just that grading happened, is what makes this fail against the pre-cutover code — every card, however, was already migrated to `onAttempt` in Tasks 7–11, so at this point in the plan the actual failure is that `EssentialWordsSession.tsx` still passes `onGraded={submitGrade}`, a prop that no card accepts anymore — this should be a hard compile/runtime error, not just a logic gap, which Step 4 resolves).

- [ ] **Step 4: Add the `onAttempt` adapter and wire every card**

In `components/practice/essential-words/EssentialWordsSession.tsx`, add near the top (after the existing imports):

```tsx
import { attemptGrade, gradeToLegacyQuality, type AttemptOutcome } from '@/lib/essential-words/attempt-grade'
```

Inside the component, add a single adapter that every card's `onAttempt` prop is set to:

```tsx
  const handleAttempt = async (outcome: AttemptOutcome) => {
    const grade = attemptGrade(outcome)
    const quality = gradeToLegacyQuality(grade)
    await submitGrade(quality)
  }
```

Then replace every card's `onGraded={submitGrade}` prop with `onAttempt={handleAttempt}` — for the 8 cards: `DictationCard`, `ClozeCard`, `RecognizeCard`, `RecognizeAudioCard`, `RecallTranslationCard`, `WeakFormCard`, `SpeakReviewCard`, and any other consumer found in Step 1. `SpeakReviewCard`'s `extras` (accuracy/transcript) parameter no longer exists on its new `onAttempt` signature (Task 11 removed it) — confirm no other code in this file reads `extras` from a `SpeakReviewCard` callback before finishing this step.

- [ ] **Step 5: Flip the level-3 flag's default now that hints/feedback exist**

In `lib/essential-words/level3-flag.ts`, update the doc comment (the flag mechanism itself — reading `process.env.NEXT_PUBLIC_ESSENTIAL_WORDS_LEVEL3`, defaulting to the env var's absence being `false` — does not need to change; what changes is the actual environment configuration once this phase ships). Add a note above the existing export:

```ts
// Fase B has landed alongside this comment: hints (hint-ladder.ts), typo
// tolerance (typo.ts), diff feedback (AnswerDiff.tsx), and priced grading
// (attempt-grade.ts) all exist now. Per spec "Fases A y B se despliegan
// juntas", THIS is the point where ESSENTIAL_WORDS_LEVEL3_ENABLED should be
// flipped to true in the deployment environment (set
// NEXT_PUBLIC_ESSENTIAL_WORDS_LEVEL3=true) — flipping the constant's default
// in code is deliberately NOT done here, since environment-driven flags
// should be flipped via the environment, not by changing what "unset" means.
```

Do not change the `process.env.NEXT_PUBLIC_ESSENTIAL_WORDS_LEVEL3 === "true"` line itself — the flip is an environment/deployment action, documented here so the next person doing that deployment finds the reasoning, not a code change in this task.

- [ ] **Step 6: Run the full essential-words test suite**

Run: `npx vitest run components/practice/essential-words lib/essential-words`
Expected: PASS, all files, including every card's individual test file from Tasks 7–11.

- [ ] **Step 7: Type-check and lint**

Run: `pnpm type-check`
Run: `npx eslint components/practice/essential-words lib/essential-words`
Expected: both exit 0.

- [ ] **Step 8: Commit**

```bash
git add components/practice/essential-words/EssentialWordsSession.tsx components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx lib/essential-words/level3-flag.ts
git commit -m "feat(essential-words): wire onAttempt through EssentialWordsSession, document level-3 flag flip"
```

---

### Task 13: Full-suite verification

**Files:** none new — verification-only, with fixes only if a gap is found.

- [ ] **Step 1: Run the full essential-words related suite**

Run: `npx vitest run components/practice/essential-words lib/essential-words hooks`
Expected: PASS, all files.

- [ ] **Step 2: Full repo test run**

Run: `npx vitest run`
Expected: PASS, no new failures anywhere in the repo.

- [ ] **Step 3: Type-check, lint, dataset gate**

Run:
```bash
pnpm type-check
pnpm lint
pnpm validate:essential-words
```
Expected: all pass.

- [ ] **Step 4: Manual browser check**

Run `pnpm dev`, open `/practice/essential-words` with `NEXT_PUBLIC_ESSENTIAL_WORDS_LEVEL3=true` set locally. Verify: a level-3 exercise (`cloze_sentence` or `dictation_sentence`) renders; failing it once shows `AnswerDiff` feedback with a repair prompt, not an immediate reveal; failing it with 2+ hints used grades `Again` (verify via whatever local dev-tools/logging is available, or trust the unit-tested `attemptGrade` and just confirm the hint button appears and is clickable); a short word (e.g. `to`) shows a 3-rung ladder with no letter-count in its category hint; a `dictation_word`/`dictation_sentence` card's "escuchar de nuevo" button can be clicked multiple times without the hint count increasing.

- [ ] **Step 5: Commit any fixes found**

```bash
git status
```

If clean, no commit needed.

---

## Self-Review

**Spec §2 requirement-to-task mapping:**

| Spec item | Task |
|---|---|
| §2.1 `AttemptOutcome` → `Grade` table, all precedence rules | Task 1 |
| §2.2 only first attempt grades; repair decides relearning-exit, not grade | Encoded in every card's first-fail-then-repair pattern (Tasks 7–11); `firstTryFailed` flag consumed by Task 1 |
| §2.3 hint ladder by length, audio-cost rule, no hints on multiple-choice | Task 3 |
| §2.4 rescue always grades Again | Task 1 (property-tested), no card in this plan implements a rescue UI — **flagged as a gap below** |
| §2.4b distractor policy | Task 4, wired into Task 9 |
| §2.5 diff feedback, typo-aware, optional explanation | Task 6 |
| §2.6 semantic typo detection | Task 2 |
| §2.7 consequences declared (2+ hints = Again; 3rd hint/reveal free past that point) | Encoded directly in Task 1's `attemptGrade` precedence and documented in its comment |
| Level-3 flag flip | Task 12 Step 5 |

**Gap found during self-review, not silently dropped:** spec §2.4's "rescate a opciones múltiples" (converting a failed typed-input attempt into multiple choice mid-exercise) is graded correctly by `attempt-grade.ts` (Task 1's `rescued: true` branch is fully tested), but **no card in Tasks 7–11 actually implements the UI that offers this rescue**. Every migrated card's failure path goes straight to `AnswerDiff` + a "try again" repair, never to a multiple-choice fallback. This is a real scope gap, not an oversight to paper over: implementing rescue UI requires each typed-input card to conditionally render `RecognizeCard`'s option-grid pattern inline after a fail, which is enough new UI surface (and enough additional per-card testing) that bundling it into Tasks 7–11 would have made each of those tasks materially larger and riskier to land individually. **This plan explicitly leaves rescue-to-multiple-choice UI for a follow-up task** — `attempt-grade.ts`'s contract already supports it correctly (any future card can build `{ rescued: true, correct, ... }` and get the right grade), so this is additive follow-up work, not a rework.

**Placeholder-pattern scan:** two tasks (Task 11 Step 6, Task 12 Step 2) contain test bodies that are deliberately incomplete with an explicit note directing the implementer to complete them against the *actual* file's existing mock conventions, rather than a guessed mock shape that risks testing nothing. This is flagged inline in both places as a deliberate choice (not a TODO/TBD left unexplained) — every other test in this plan is complete, runnable code. No `TODO`/`TBD`/"add appropriate handling" strings appear anywhere else.

**Type/signature consistency check:**
- `AttemptOutcome` (Task 1) fields (`correct`, `hintsUsed`, `rescued`, `typo`, `firstTryFailed`, `latencyMs`) are used identically across Tasks 7–12 — no field renamed or reordered anywhere.
- `onAttempt: (outcome: AttemptOutcome) => Promise<void>` is the exact prop name and signature on every migrated card (Tasks 7–11) and the exact type `EssentialWordsSession.tsx`'s `handleAttempt` (Task 12) satisfies.
- `buildHintLadder(entry, mode)` (Task 3) is called with the same two-argument shape in every card that uses it (Tasks 7, 8, 10).
- `selectDistractors(target, pool, homophones, count)` (Task 4) signature matches its one call site in Task 9.
- `attemptGrade`/`gradeToLegacyQuality` (Task 1) are called only once, centrally, in Task 12's `handleAttempt` — no card calls either directly (Task 7's draft initially referenced `attemptGrade` inline and Step 3's note explicitly walks back that reference to keep the single-call-site property intact).

---

## Verification

- [ ] `npx vitest run` passes with no new failures
- [ ] `pnpm type-check` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm validate:essential-words` passes
- [ ] `git log --oneline` shows one commit per task above, each green at commit time
- [ ] Manual check (Task 13 Step 4): level-3 exercises render, hints price correctly, typo tolerance works, dictation audio is free

**This is the phase that makes the Fase A + B redesign shippable to users.** Per the spec's "Fases A y B se despliegan juntas": Fase A alone would starve the review queue (no word ever reaches graduation without production exercises); this phase supplies the hints and feedback that make production exercises fair, and flips the level-3 gate (via environment configuration, Task 12 Step 5) that Fase A left dark. One deliberate scope gap remains for a follow-up task: rescue-to-multiple-choice UI (spec §2.4) is correctly gradeable by `attempt-grade.ts` today but not yet rendered by any card.
