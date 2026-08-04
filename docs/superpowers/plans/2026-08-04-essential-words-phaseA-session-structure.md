# Essential Words — Fase A: Estructura de sesión (bloques + techo de tiempo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat new/review/learning queue with a pure block-based state machine (`session-plan.ts`) that separates exposure from practice, enforces the 1→2→3 difficulty ladder and reinsertion cap per spec §1, adds a time ceiling that truncates new words before reviews, and persists pre-graduation progress — all gated behind a level-3 feature flag and shipped internal-only, since Fase A alone (without Fase B's hints/feedback) is a UX regression per the spec's explicit "Fases A y B se despliegan juntas" decision.

**Architecture:** A new pure module family under `lib/essential-words/session-plan*.ts` implements `nextStep(state, allWords)`/`applyResult(state, result, phase?)` as a deterministic, seedable state machine wrapping the *existing* `exercise-modes.ts` (`selectMode`/`modeHasData`) and `sentence-variants.ts` rather than replacing them. `srsRatingEvents` (existing Dexie table, `lib/db/index.ts`) gains an `entityType: "essential_words"` variant plus new optional fields for the FSRS-precursor log. A new `essentialWordProgress` Dexie table holds pre-graduation state with pure resumption-decision functions. `useEssentialWordsSession` is migrated incrementally behind an internal flag so the old flat-queue behavior and the new block-based behavior can be verified side by side before cutover.

**Tech Stack:** TypeScript, React 19, Vitest (unit + property tests), Dexie 4 (IndexedDB), Next.js 16 App Router. Tests live in `__tests__/` subdirs alongside source, following this codebase's established `EssentialWord` fixture and `vi.hoisted`/`vi.mock('@/lib/db', ...)` conventions.

**Spec:** `docs/superpowers/specs/2026-08-04-essential-words-learning-sessions-design.md`, §1 and §4 (also §7.1–§7.3 for invariants and "Fases A y B se despliegan juntas" for scope).

---

## Context the engineer needs

- The codebase already has 8 exercise modes wired up (`lib/essential-words/exercise-modes.ts`): `study`, `recognize_translation`, `recognize_meaning`, `recognize_audio`, `dictation_sentence`, `cloze_sentence`, `weak_form`, `recall_translation`, `speak_sentence`. Fase A's job is to **wrap** `selectMode`/`modeHasData` in block/level structure — not replace them. Map the spec's 3-level ladder onto the existing modes:
  - Level 1 (reconocimiento): `recognize_translation`, `recognize_meaning`, `recognize_audio`
  - Level 2 (recuerdo): `recall_translation` (`dictation_word` does not exist yet — Fase B introduces it; Fase A's level 2 uses `recall_translation` only until then)
  - Level 3 (producción): `cloze_sentence`, `dictation_sentence` (gated behind the level-3 flag this phase introduces)
- `hooks/useEssentialWordsSession.ts` is 355 lines today. Read it in full before Task 12 — it already has lapse persistence (`pendingLapsesRef`/`savePendingLapses`), `finishSession`/`recordActivitySession`/sync-outbox flush, `archiveWord`/`keepSnooze`/`masterWord` (all funnel through `removeCurrentAndAdvance`), `learnMore` (appends a new batch mid-session via `appendNewBatch`), and CEFR-level/pos filtering via `setLevels`/`setRoute`. Every one of these must keep working after the cutover.
- `lib/db/index.ts` already has `SRSRatingEventRecord`/`srsRatingEvents` (Dexie table, currently `entityType: "word_bank" | "topic_srs"` only) and the Dexie version-bump pattern (`this.version(N).stores({...})`, sequential). **Check the current highest `this.version(N)` in the file before Task 6/7 — do not assume it is still whatever number is shown in this plan's snippets; if the file has moved on, renumber your bump accordingly and note it in the commit.**
- No generic feature-flag system exists in this codebase. The established precedent for a simple on/off toggle is an exported `const` reading `process.env.NEXT_PUBLIC_*` (search `lib/gemini/fallback.ts` for `ENABLE_PREVIEW_MODELS` if you want to confirm the pattern before Task 8) — a full flag framework is not needed here.
- `lib/essential-words/queue.ts`'s existing `buildSessionQueue`, `reinsertLearning`, `deriveCounts`, `appendNewBatch` are **not deleted or modified** by this plan. They stay in place (still used elsewhere, e.g. by `session-loader.ts`) — Fase A adds a parallel `session-plan.ts` family and only the hook (Task 12) switches which one it calls.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `lib/essential-words/session-plan-types.ts` | Create | Shared types: `Step`, `SessionState`, `Block`, `AttemptResult` |
| `lib/essential-words/session-plan-blocks.ts` | Create | Pure block construction: `buildBlocks(words, seed)`, the 3-or-4 redistribution rule (§1.1) |
| `lib/essential-words/session-plan.ts` | Create | The state machine: `nextStep`, `applyResult`, sequencing, reinsertion cap, monotonicity, final round, plus `deriveCounts`/`removeWord`/`appendWords` helpers for hook integration |
| `lib/essential-words/session-plan-time-ceiling.ts` | Create | Pure duration estimation + truncation (§4.1), review chunking (§1.3) |
| `lib/essential-words/essential-word-progress.ts` | Create | Pure resumption logic: `resumeState(record, now)` (§4.2/§4.3) — no Dexie import |
| `lib/essential-words/level3-flag.ts` | Create | `ESSENTIAL_WORDS_LEVEL3_ENABLED` + `gateLevel3Mode` — the Fase A/B gate |
| `lib/db/index.ts` | Modify | Extend `SRSRatingEventRecord` with essential_words fields; add `essentialWordProgress` table; Dexie version bumps; `recordEssentialWordsReviewEvent`/`getEssentialWordProgress`/`saveEssentialWordProgress`/`archiveEssentialWordProgress` helpers |
| `hooks/useEssentialWordsSession.ts` | Modify (staged, Tasks 10–12) | Drive from `session-plan.ts` instead of `queue.ts`, preserving every other existing behavior |

All new `lib/essential-words/session-plan*.ts` files stay well under 250 lines by construction (split by concern above).

---

### Task 1: `session-plan-types.ts` — shared types

**Files:**
- Create: `lib/essential-words/session-plan-types.ts`
- Test: `lib/essential-words/__tests__/session-plan-types.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/essential-words/__tests__/session-plan-types.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Step, SessionState, Block, AttemptResult } from "../session-plan-types";

const fixtureWord = {
  rank: 1, word: "the", pos: "article" as const, ipa_strong: "/ðə/",
  example_sentence: "The end.", cefr_level: "A1" as const,
};

describe("session-plan-types", () => {
  it("Step discriminates on kind", () => {
    const expose: Step = { kind: "expose", word: fixtureWord };
    const exercise: Step = { kind: "exercise", word: fixtureWord, level: 1, mode: "recognize_translation" };
    expect(expose.kind).toBe("expose");
    expect(exercise.kind).toBe("exercise");
  });

  it("SessionState carries blocks, cursor, and seed", () => {
    const state: SessionState = {
      seed: 1, blocks: [], blockIndex: 0, history: [], finalRoundQueue: [], finalRoundDone: false,
    };
    expect(state.seed).toBe(1);
  });

  it("AttemptResult carries correctness and word/level", () => {
    const result: AttemptResult = { correct: false, wordId: "c1k:the", level: 1 };
    expect(result.correct).toBe(false);
  });

  it("Block carries word ids, level cursor per word, fail counts, and exposure tracking", () => {
    const block: Block = {
      wordIds: ["c1k:the"], levelReached: { "c1k:the": 0 }, failCount: { "c1k:the": 0 }, exposed: new Set(),
    };
    expect(block.wordIds).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/essential-words/__tests__/session-plan-types.test.ts`
Expected: FAIL — cannot resolve `../session-plan-types`.

- [ ] **Step 3: Write the implementation**

Create `lib/essential-words/session-plan-types.ts`:

```ts
// Shared types for the Fase A session state machine (spec §1.8). Split from
// session-plan.ts so session-plan-blocks.ts and session-plan-time-ceiling.ts
// can import types without importing the state machine itself.

import type { EssentialWord } from "./types";
import type { EssentialWordMode } from "./exercise-modes";

/** One unit of work the hook renders. Exposure has no exercise; practice does. */
export type Step =
  | { kind: "expose"; word: EssentialWord }
  | { kind: "exercise"; word: EssentialWord; level: 1 | 2 | 3; mode: EssentialWordMode };

/**
 * One block: 3 or 4 words (spec §1.1), never fewer. `levelReached` tracks the
 * highest level each word has completed *in this block* (monotonicity, §1.5).
 * `failCount` tracks in-block failures per word (reinsertion cap, §1.7).
 * `exposed` tracks which words have had their exposure step already emitted.
 */
export interface Block {
  wordIds: string[];
  levelReached: Record<string, 0 | 1 | 2 | 3>;
  failCount: Record<string, number>;
  exposed: Set<string>;
}

/** Outcome of one exercise attempt, fed back via applyResult. */
export interface AttemptResult {
  wordId: string;
  level: 1 | 2 | 3;
  correct: boolean;
}

/**
 * The full state threaded through nextStep/applyResult. `history` is the
 * ordered list of wordIds emitted as exercise steps so far in the *current
 * block*, used to enforce the distance-≥2 sequencing rule (§1.7).
 * `finalRoundQueue`/`finalRoundDone` back the mixed final round (§1.4), run
 * once all blocks are exhausted.
 */
export interface SessionState {
  seed: number;
  blocks: Block[];
  blockIndex: number;
  history: string[];
  finalRoundQueue: string[];
  finalRoundDone: boolean;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/essential-words/__tests__/session-plan-types.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/session-plan-types.ts lib/essential-words/__tests__/session-plan-types.test.ts
git commit -m "feat(essential-words): add session-plan shared types for Fase A state machine"
```

---

### Task 2: `session-plan-blocks.ts` — block construction (3-or-4 rule)

**Files:**
- Create: `lib/essential-words/session-plan-blocks.ts`
- Test: `lib/essential-words/__tests__/session-plan-blocks.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/essential-words/__tests__/session-plan-blocks.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildBlocks, blockSizes, leftoverWords } from "../session-plan-blocks";
import type { EssentialWord } from "../types";

function word(rank: number, w: string): EssentialWord {
  return { rank, word: w, pos: "noun", ipa_strong: `/${w}/`, example_sentence: `I see the ${w}.`, cefr_level: "A1" };
}
function words(n: number): EssentialWord[] {
  return Array.from({ length: n }, (_, i) => word(i + 1, `w${i + 1}`));
}

describe("blockSizes — spec §1.1 exact redistribution", () => {
  it("n % 3 == 0: all blocks of 3", () => {
    expect(blockSizes(9)).toEqual([3, 3, 3]);
  });

  it("n % 3 == 1 (n=10): 3+3+4", () => {
    expect(blockSizes(10)).toEqual([3, 3, 4]);
  });

  it("n % 3 == 1 (n=7): 3+4", () => {
    expect(blockSizes(7)).toEqual([3, 4]);
  });

  it("n % 3 == 2 (n=8): 4+4, never a trailing 2", () => {
    expect(blockSizes(8)).toEqual([4, 4]);
  });

  it("n % 3 == 2 (n=11): 3+4+4", () => {
    expect(blockSizes(11)).toEqual([3, 4, 4]);
  });

  it("n=3: [3]. n=4: [4]. n=5: no valid partition into 3s/4s only — treated as leftover-heavy, one block of 3 plus 2 leftover would violate 'never 2', so n=5 yields [3] with 2 leftover, or [4] with 1 leftover — must not produce a block of size other than 3 or 4", () => {
    expect(blockSizes(3)).toEqual([3]);
    expect(blockSizes(4)).toEqual([4]);
    const s5 = blockSizes(5);
    expect(s5.every((n) => n === 3 || n === 4)).toBe(true);
    expect(s5.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(5);
  });

  it("n=0, n=1, n=2: no blocks (below minimum)", () => {
    expect(blockSizes(0)).toEqual([]);
    expect(blockSizes(1)).toEqual([]);
    expect(blockSizes(2)).toEqual([]);
  });

  it("property: for all n in 0..60, every block is 3 or 4 and leftover is always < 3", () => {
    for (let n = 0; n <= 60; n++) {
      const sizes = blockSizes(n);
      for (const size of sizes) expect([3, 4]).toContain(size);
      const total = sizes.reduce((a, b) => a + b, 0);
      expect(n - total).toBeGreaterThanOrEqual(0);
      expect(n - total).toBeLessThan(3);
    }
  });
});

describe("buildBlocks", () => {
  it("N=10 -> 3 blocks sized 3,3,4, covering all 10 words", () => {
    const blocks = buildBlocks(words(10), 1);
    expect(blocks.map((b) => b.wordIds.length)).toEqual([3, 3, 4]);
    const allIds = blocks.flatMap((b) => b.wordIds);
    expect(new Set(allIds).size).toBe(10);
  });

  it("every word appears in exactly one block, in input order", () => {
    const ws = words(7);
    const blocks = buildBlocks(ws, 5);
    const flat = blocks.flatMap((b) => b.wordIds);
    expect(flat).toEqual(["c1k:w1", "c1k:w2", "c1k:w3", "c1k:w4", "c1k:w5", "c1k:w6", "c1k:w7"]);
  });

  it("is deterministic for a given seed", () => {
    const a = buildBlocks(words(10), 42);
    const b = buildBlocks(words(10), 42);
    expect(a.map((blk) => blk.wordIds)).toEqual(b.map((blk) => blk.wordIds));
  });

  it("initializes levelReached=0 and failCount=0 for every word, exposed empty", () => {
    const [block] = buildBlocks(words(3), 1);
    expect(block.levelReached).toEqual({ "c1k:w1": 0, "c1k:w2": 0, "c1k:w3": 0 });
    expect(block.failCount).toEqual({ "c1k:w1": 0, "c1k:w2": 0, "c1k:w3": 0 });
    expect(block.exposed.size).toBe(0);
  });

  it("N=1 or N=2: zero blocks", () => {
    expect(buildBlocks(words(1), 1)).toEqual([]);
    expect(buildBlocks(words(2), 1)).toEqual([]);
  });
});

describe("leftoverWords", () => {
  it("returns the words not included in any block", () => {
    const ws = words(2);
    expect(leftoverWords(ws)).toEqual(ws);
  });

  it("returns empty when N is fully blocked", () => {
    expect(leftoverWords(words(9))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/essential-words/__tests__/session-plan-blocks.test.ts`
Expected: FAIL — cannot resolve `../session-plan-blocks`.

- [ ] **Step 3: Write the implementation**

Create `lib/essential-words/session-plan-blocks.ts`:

```ts
// Block construction for Fase A (spec §1.1). A block is 3 or 4 words, never
// 1 or 2 — repeating the same word back-to-back resolves from working
// memory, not long-term recall. Pure: no I/O, deterministic per seed.

import { essentialWordId } from "./types";
import type { EssentialWord } from "./types";
import type { Block } from "./session-plan-types";

/**
 * Partition `n` words into block sizes of 3 or 4 per spec §1.1:
 *   n % 3 == 0  ->  all blocks of 3
 *   n % 3 == 1  ->  all blocks of 3 except the last, which takes 4
 *   n % 3 == 2  ->  redistribute: no block of 2. Take 4s from the tail until
 *                   the remainder resolves to a clean multiple of 3 (or 0).
 *
 * n < 3 produces no blocks — the caller carries the leftover into a resumed
 * or combined-with-reviews session rather than starting a degenerate block
 * (spec §4.1: "si no cabe un bloque completo de 3, no se empieza").
 */
export function blockSizes(n: number): number[] {
  if (n < 3) return [];
  const mod = n % 3;
  if (mod === 0) return Array(n / 3).fill(3);
  if (mod === 1) {
    // n=4 -> [4]. n=7 -> [3,4]. n=10 -> [3,3,4]. General: (n-4)/3 blocks of 3, then one 4.
    const threes = (n - 4) / 3;
    return [...Array(threes).fill(3), 4];
  }
  // mod === 2: n=5 -> can't reach a clean split with only 3s/4s and n<8, so
  // fall back to a single block of 4 (favoring never leaving 2, tolerating a
  // small leftover instead — n=5 yields [4] with 1 leftover, matching the
  // "leftover < 3" invariant). n=8 -> [4,4]. n=11 -> [3,4,4].
  if (n < 8) return [4];
  const fours = 2;
  const remainderAfterFours = n - fours * 4;
  const threes = Math.floor(remainderAfterFours / 3);
  return [...Array(threes).fill(3), 4, 4];
}

/** Build ordered blocks from `words`, preserving input order (callers pass
 *  already-prioritized words, e.g. due reviews first). `seed` is threaded
 *  through for API symmetry with the rest of session-plan.ts. */
export function buildBlocks(words: EssentialWord[], seed: number): Block[] {
  void seed; // reserved: word order is currently caller-determined, not shuffled
  const sizes = blockSizes(words.length);
  const blocks: Block[] = [];
  let offset = 0;
  for (const size of sizes) {
    const chunk = words.slice(offset, offset + size);
    offset += size;
    const wordIds = chunk.map((w) => essentialWordId(w.word));
    blocks.push({
      wordIds,
      levelReached: Object.fromEntries(wordIds.map((id) => [id, 0])),
      failCount: Object.fromEntries(wordIds.map((id) => [id, 0])),
      exposed: new Set(),
    });
  }
  return blocks;
}

/** Words left over after blocking (fewer than 3 remain) — caller carries
 *  these forward into the next session or a review-chunk boundary. */
export function leftoverWords(words: EssentialWord[]): EssentialWord[] {
  const blocked = blockSizes(words.length).reduce((a, b) => a + b, 0);
  return words.slice(blocked);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/essential-words/__tests__/session-plan-blocks.test.ts`
Expected: PASS — 16 tests including the 0..60 property sweep.

If the property test fails for a specific `n`, print `blockSizes(n)` for that value and check whether the sum/leftover breaks the invariant — fix `blockSizes`, do not weaken the assertion.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/session-plan-blocks.ts lib/essential-words/__tests__/session-plan-blocks.test.ts
git commit -m "feat(essential-words): add block partitioning for Fase A (3-4 words, never 1-2)"
```

---

### Task 3: `session-plan.ts` — the state machine core

**Files:**
- Create: `lib/essential-words/session-plan.ts`
- Test: `lib/essential-words/__tests__/session-plan.test.ts`

This is the highest-complexity pure module in the phase.

- [ ] **Step 1: Write the failing test**

Create `lib/essential-words/__tests__/session-plan.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createSessionPlan, nextStep, applyResult } from "../session-plan";
import type { EssentialWord } from "../types";
import { essentialWordId } from "../types";

function word(rank: number, w: string): EssentialWord {
  return {
    rank, word: w, pos: "noun", ipa_strong: `/${w}/`,
    example_sentence: `I really like the ${w} we bought yesterday.`,
    cefr_level: "A1", meaning: `meaning of ${w}`, translation: `trad-${w}`,
  };
}
function words(n: number): EssentialWord[] {
  return Array.from({ length: n }, (_, i) => word(i + 1, `word${i + 1}`));
}
function wordMap(ws: EssentialWord[]): Map<string, EssentialWord> {
  return new Map(ws.map((w) => [essentialWordId(w.word), w]));
}

type DrainStep = { step: NonNullable<ReturnType<typeof nextStep>>; result?: boolean };

/** Drains steps until nextStep returns null, applying correctFn to every
 *  exercise attempt. attemptIndex is per (wordId, level) pair. */
function drain(
  words: EssentialWord[],
  seed: number,
  correctFn: (wordId: string, level: 1 | 2 | 3, attemptIndex: number) => boolean,
  maxSteps = 3000,
) {
  const allWords = wordMap(words);
  let state = createSessionPlan(words, seed);
  const log: DrainStep[] = [];
  const attemptCounts = new Map<string, number>();
  for (let i = 0; i < maxSteps; i++) {
    const step = nextStep(state, allWords);
    if (!step) return { log, finalState: state, ranOut: false };
    if (step.kind === "expose") {
      log.push({ step });
      state = applyResult(state, { wordId: essentialWordId(step.word.word), level: 1, correct: true }, "expose");
      continue;
    }
    const wordId = essentialWordId(step.word.word);
    const key = `${wordId}:${step.level}`;
    const n = attemptCounts.get(key) ?? 0;
    attemptCounts.set(key, n + 1);
    const correct = correctFn(wordId, step.level, n);
    log.push({ step, result: correct });
    state = applyResult(state, { wordId, level: step.level, correct });
  }
  return { log, finalState: state, ranOut: true };
}

describe("session-plan — exposure precedes practice within a block", () => {
  it("emits all exposure steps for a 3-word block before any exercise step", () => {
    const { log } = drain(words(3), 1, () => true, 3);
    expect(log.map((l) => l.step.kind)).toEqual(["expose", "expose", "expose"]);
  });
});

describe("session-plan — monotonicity: level 3 never precedes 1 and 2 for the same word in-block (invariant 4)", () => {
  it("each word's exercise levels within a block are non-decreasing and start at 1", () => {
    const { log } = drain(words(3), 1, () => true);
    const exerciseSteps = log.filter((l) => l.step.kind === "exercise");
    const maxSeen = new Map<string, number>();
    for (const { step } of exerciseSteps) {
      if (step.kind !== "exercise") continue;
      const id = essentialWordId(step.word.word);
      const prevMax = maxSeen.get(id) ?? 0;
      expect(step.level).toBeGreaterThanOrEqual(prevMax);
      maxSeen.set(id, Math.max(prevMax, step.level));
    }
  });
});

describe("session-plan — sequencing: distance >= 2 between same-word exercise steps (invariant 3)", () => {
  it("never places the same word's exercise steps adjacent", () => {
    const { log } = drain(words(4), 3, () => true);
    const exerciseWordIds = log
      .filter((l) => l.step.kind === "exercise")
      .map((l) => essentialWordId((l.step as { word: EssentialWord }).word.word));
    for (let i = 1; i < exerciseWordIds.length; i++) {
      expect(exerciseWordIds[i]).not.toBe(exerciseWordIds[i - 1]);
    }
  });
});

describe("session-plan — reinsertion cap (spec §1.7, invariant 8)", () => {
  it("a word that fails once is reinserted later and gets a second attempt at the same level", () => {
    const failedOnce = new Set<string>();
    const { log } = drain(words(3), 5, (wordId, _level, attemptIndex) => {
      if (attemptIndex === 0 && !failedOnce.has(wordId)) {
        failedOnce.add(wordId);
        return false;
      }
      return true;
    });
    const exerciseSteps = log.filter((l) => l.step.kind === "exercise");
    for (const wordId of failedOnce) {
      const count = exerciseSteps.filter(
        (l) => essentialWordId((l.step as { word: EssentialWord }).word.word) === wordId,
      ).length;
      expect(count).toBeGreaterThan(1);
    }
  });

  it("a word that fails twice at the same level in the same block gets no third attempt at that level", () => {
    const { log } = drain(words(3), 5, () => false);
    const exerciseSteps = log.filter((l) => l.step.kind === "exercise");
    const counts = new Map<string, number>();
    for (const { step } of exerciseSteps) {
      if (step.kind !== "exercise") continue;
      const key = `${essentialWordId(step.word.word)}:${step.level}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const count of counts.values()) {
      expect(count).toBeLessThanOrEqual(2);
    }
  });
});

describe("session-plan — termination (spec §1.7/§1.8, invariant 9)", () => {
  it("nextStep always returns null within a bounded number of steps under adversarial all-fail sequences", () => {
    for (const n of [3, 4, 7, 8, 10, 11, 13]) {
      const { ranOut, log } = drain(words(n), n, () => false, 5000);
      expect(ranOut).toBe(false);
      // Generous bound: per word, at most 2 attempts x 3 levels + 1 exposure
      // + 1 final-round attempt = 8 steps. Well within 5000 regardless of n.
      expect(log.length).toBeLessThanOrEqual(n * 8 + 20);
    }
  });

  it("property: 30 seeded pseudo-random fail patterns all terminate (reproducible, not Math.random)", () => {
    for (let trial = 0; trial < 30; trial++) {
      const n = 3 + (trial % 10);
      let x = trial * 2654435761 + 1;
      const rand = () => {
        x = (x * 1103515245 + 12345) & 0x7fffffff;
        return x / 0x7fffffff;
      };
      const { ranOut } = drain(words(n), trial, () => rand() > 0.5, 5000);
      expect(ranOut).toBe(false);
    }
  });
});

describe("session-plan — final mixed round (spec §1.4)", () => {
  it("after all blocks are exhausted, every word gets exactly one final-round exercise, out of block context", () => {
    const ws = words(3);
    const { log } = drain(ws, 1, () => true);
    const finalRoundSteps = log.filter(
      (l, i) => i >= log.length - 3 && l.step.kind === "exercise" && l.step.level === 3,
    );
    expect(finalRoundSteps.length).toBe(3);
  });

  it("a final-round attempt does not touch block state (it is graded separately by the caller)", () => {
    const ws = words(3);
    const { finalState } = drain(ws, 1, () => true);
    expect(finalState.finalRoundDone).toBe(true);
    expect(finalState.finalRoundQueue).toEqual([]);
  });
});

describe("session-plan — edge cases", () => {
  it("a single-block session (N=3) with one word failing twice still terminates; the other two reach the final round", () => {
    const failTarget = essentialWordId("word1");
    const { log, ranOut } = drain(words(3), 2, (wordId) => wordId !== failTarget);
    expect(ranOut).toBe(false);
    const finalRoundForSurvivors = log.filter(
      (l, i) =>
        i >= log.length - 2 &&
        l.step.kind === "exercise" &&
        essentialWordId((l.step as { word: EssentialWord }).word.word) !== failTarget,
    );
    expect(finalRoundForSurvivors.length).toBeGreaterThan(0);
  });

  it("N=0 (empty word list): nextStep returns null immediately", () => {
    const state = createSessionPlan([], 1);
    expect(nextStep(state, new Map())).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/essential-words/__tests__/session-plan.test.ts`
Expected: FAIL — cannot resolve `../session-plan`.

- [ ] **Step 3: Write the implementation**

Create `lib/essential-words/session-plan.ts`:

```ts
// Pure state machine for Fase A session structure (spec §1.8). No I/O; the
// hook (useEssentialWordsSession.ts) is the only caller with side effects.
// Wraps exercise-modes.ts's selectMode/modeHasData — this module decides
// *when* a word gets which level, not *how* a level maps to a rendered mode.

import { buildBlocks } from "./session-plan-blocks";
import { selectMode, modeHasData } from "./exercise-modes";
import { essentialWordId } from "./types";
import type { EssentialWord } from "./types";
import type { AttemptResult, Block, SessionState, Step } from "./session-plan-types";

/** Max in-block reinsertions per word (spec §1.7): fails once -> reinserted
 *  once; fails twice at the same level -> that level (and the word's climb
 *  past it) is abandoned for this block. */
const MAX_REINSERTIONS_PER_WORD = 1;
/** Minimum exercises between two appearances of the same word (spec §1.7). */
const MIN_DISTANCE = 2;

/** Build the initial state for a set of words, ordered as the caller wants
 *  them prioritized (e.g. due reviews first) — this function does not reorder. */
export function createSessionPlan(words: EssentialWord[], seed: number): SessionState {
  const blocks = buildBlocks(words, seed);
  return {
    seed,
    blocks,
    blockIndex: 0,
    history: [],
    finalRoundQueue: words.map((w) => essentialWordId(w.word)),
    finalRoundDone: false,
  };
}

function wordById(id: string, allWords: Map<string, EssentialWord>): EssentialWord {
  const w = allWords.get(id);
  if (!w) throw new Error(`session-plan: unknown wordId ${id}`);
  return w;
}

/** A word has "exited" its climb once it has failed a level twice in-block. */
function hasExited(block: Block, id: string): boolean {
  return block.failCount[id] > MAX_REINSERTIONS_PER_WORD;
}

/** True once every word in the block has either reached level 3 or exited. */
function blockComplete(block: Block): boolean {
  return block.wordIds.every((id) => block.levelReached[id] === 3 || hasExited(block, id));
}

function pickModeForLevel(word: EssentialWord, level: 1 | 2 | 3): { mode: import("./exercise-modes").EssentialWordMode } {
  // selectMode's tiers are keyed by SM-2 repetitions; level-1 = tender,
  // level-2 = middle, level-3 = mature is the closest existing mapping,
  // reusing modeHasData's own eligibility filtering rather than duplicating it.
  const repsForLevel = level === 1 ? 0 : level === 2 ? 3 : 6;
  const mode = selectMode({ kind: "review", entry: word, repetitions: repsForLevel });
  return { mode };
}

/**
 * Next pending (wordId, targetLevel) pair within `block`, honoring:
 *  - monotonicity: a word only becomes eligible for level L once it has
 *    reached level L-1 (levelReached === L-1);
 *  - the reinsertion cap: a word that has exited (hasExited) is skipped;
 *  - level order: level 1 across all eligible words is offered before any
 *    level 2, and level 2 before any level 3 — this is what keeps a block's
 *    early steps at the easy end and produces the escalera shape;
 *  - the distance>=2 rule against `history`: prefer a candidate not in the
 *    last MIN_DISTANCE history entries; fall back to the only candidate left
 *    when the rule would otherwise stall (single-word-remaining case).
 */
function nextPendingInBlock(block: Block, history: string[]): { id: string; level: 1 | 2 | 3 } | null {
  for (const level of [1, 2, 3] as const) {
    const candidates = block.wordIds.filter((id) => {
      if (hasExited(block, id)) return false;
      return block.levelReached[id] === level - 1;
    });
    if (candidates.length === 0) continue;
    const recent = history.slice(-MIN_DISTANCE);
    const eligible = candidates.filter((id) => !recent.includes(id));
    const pick = eligible[0] ?? candidates[0];
    return { id: pick, level };
  }
  return null;
}

/**
 * Returns the next step, or null when the session (all blocks + final round)
 * is complete. `allWords` resolves Block's wordIds back to full EssentialWord
 * objects — Block itself only stores ids to keep session-plan-types.ts free
 * of a dependency on full word payloads in its serializable state shape.
 */
export function nextStep(state: SessionState, allWords: Map<string, EssentialWord>): Step | null {
  const block = state.blocks[state.blockIndex];
  if (block) {
    const nextToExpose = block.wordIds.find((id) => !block.exposed.has(id));
    if (nextToExpose) return { kind: "expose", word: wordById(nextToExpose, allWords) };

    const pending = nextPendingInBlock(block, state.history);
    if (pending) {
      const word = wordById(pending.id, allWords);
      const { mode } = pickModeForLevel(word, pending.level);
      return { kind: "exercise", word, level: pending.level, mode };
    }
    // Nothing pending: either the block is complete (applyResult already
    // advanced blockIndex past it — see below) or every remaining candidate
    // was excluded solely by the distance rule with no fallback, which only
    // happens transiently between two calls in the same render tick and
    // resolves on the next nextStep call once history is naturally longer.
    // Falling through to the final round is safe: blockComplete gates the
    // blockIndex advance in applyResult, so reaching here with a still-open
    // block only happens when every remaining word has exited.
    return finalRoundStep(state, allWords);
  }
  return finalRoundStep(state, allWords);
}

function finalRoundStep(state: SessionState, allWords: Map<string, EssentialWord>): Step | null {
  if (state.finalRoundDone || state.finalRoundQueue.length === 0) return null;
  const id = state.finalRoundQueue[0];
  const word = wordById(id, allWords);
  const mode = modeHasData(word, "cloze_sentence") ? "cloze_sentence" : "speak_sentence";
  return { kind: "exercise", word, level: 3, mode };
}

/**
 * Advance state given the outcome of the step just shown. `phase` disambiguates
 * an exposure acknowledgment (`"expose"`, always succeeds, no grading) from a
 * graded exercise attempt. Pure — returns a new SessionState, never mutates.
 */
export function applyResult(
  state: SessionState,
  result: AttemptResult,
  phase: "expose" | "exercise" = "exercise",
): SessionState {
  const blocks = state.blocks.map((b) => ({
    ...b,
    levelReached: { ...b.levelReached },
    failCount: { ...b.failCount },
    exposed: new Set(b.exposed),
  }));
  const block = blocks[state.blockIndex];

  if (phase === "expose") {
    if (block) block.exposed.add(result.wordId);
    return { ...state, blocks };
  }

  // Final-round attempt: word is not in the current (already-exhausted) block.
  if (!block || !block.wordIds.includes(result.wordId)) {
    const finalRoundQueue = state.finalRoundQueue.filter((id) => id !== result.wordId);
    return { ...state, finalRoundQueue, finalRoundDone: finalRoundQueue.length === 0 };
  }

  const history = [...state.history, result.wordId];
  if (result.correct) {
    block.levelReached[result.wordId] = result.level;
  } else {
    block.failCount[result.wordId] += 1;
    // levelReached stays put on failure, so nextPendingInBlock re-offers the
    // same level (reinsertion) until failCount exceeds the cap, at which
    // point hasExited() removes the word from candidacy entirely.
  }

  let blockIndex = state.blockIndex;
  let nextHistory = history;
  if (blockComplete(block) && blockIndex + 1 < state.blocks.length) {
    blockIndex += 1;
    nextHistory = [];
  } else if (blockComplete(block) && blockIndex + 1 >= state.blocks.length) {
    blockIndex = state.blocks.length; // past the last block -> final round
  }

  return { ...state, blocks, blockIndex, history: nextHistory };
}

// ---------------------------------------------------------------------------
// Hook-integration helpers. These mirror queue.ts's deriveCounts/appendNewBatch
// contracts so useEssentialWordsSession.ts (Task 12) can swap engines without
// changing what it hands to SessionStatsCard or its filter/learn-more flows.
// ---------------------------------------------------------------------------

export interface PlanCounts {
  newRemaining: number;
  learningRemaining: number;
  reviewRemaining: number;
}

/** Counts remaining work across the whole plan (current block onward + final round). */
export function deriveCounts(state: SessionState): PlanCounts {
  let newRemaining = 0;
  let learningRemaining = 0;
  let reviewRemaining = 0;
  for (let i = state.blockIndex; i < state.blocks.length; i++) {
    const block = state.blocks[i];
    for (const id of block.wordIds) {
      if (!block.exposed.has(id)) newRemaining += 1;
      if (block.levelReached[id] < 3 && !hasExited(block, id)) {
        reviewRemaining += 1;
        if (block.failCount[id] > 0) learningRemaining += 1;
      }
    }
  }
  reviewRemaining += state.finalRoundQueue.length;
  return { newRemaining, learningRemaining, reviewRemaining };
}

/** Strips a word entirely from the plan — used by archive/snooze/master
 *  mid-session, which remove a word outright rather than grading it. */
export function removeWord(state: SessionState, wordId: string): SessionState {
  const blocks = state.blocks.map((b) => {
    if (!b.wordIds.includes(wordId)) return b;
    const levelReached = { ...b.levelReached };
    const failCount = { ...b.failCount };
    delete levelReached[wordId];
    delete failCount[wordId];
    const exposed = new Set(b.exposed);
    exposed.delete(wordId);
    return { ...b, wordIds: b.wordIds.filter((id) => id !== wordId), levelReached, failCount, exposed };
  });
  return {
    ...state,
    blocks,
    finalRoundQueue: state.finalRoundQueue.filter((id) => id !== wordId),
    history: state.history.filter((id) => id !== wordId),
  };
}

/** Extends the plan with new blocks built from `words` — backs the existing
 *  "learn more" mid-session flow (queue.ts's appendNewBatch equivalent). */
export function appendWords(state: SessionState, words: EssentialWord[], seed: number): SessionState {
  const newBlocks = buildBlocks(words, seed);
  return {
    ...state,
    blocks: [...state.blocks, ...newBlocks],
    finalRoundQueue: [...state.finalRoundQueue, ...words.map((w) => essentialWordId(w.word))],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/essential-words/__tests__/session-plan.test.ts`
Expected: PASS. If the monotonicity or reinsertion tests fail, inspect `nextPendingInBlock`'s level-ordering loop first — it is the single place level sequencing is enforced.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/session-plan.ts lib/essential-words/__tests__/session-plan.test.ts
git commit -m "feat(essential-words): add session-plan state machine (blocks, monotonicity, reinsertion cap, final round)"
```

---

### Task 4: `session-plan-time-ceiling.ts` — duration estimate + truncation

**Files:**
- Create: `lib/essential-words/session-plan-time-ceiling.ts`
- Test: `lib/essential-words/__tests__/session-plan-time-ceiling.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/essential-words/__tests__/session-plan-time-ceiling.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  estimateDurationMs,
  truncateToTimeBudget,
  chunkReviews,
  SECONDS_PER_EXPOSE,
  SECONDS_PER_EXERCISE,
  SESSION_BUDGET_MS,
  REVIEW_CHUNK_THRESHOLD,
  REVIEW_CHUNK_SIZE,
} from "../session-plan-time-ceiling";
import type { EssentialWord } from "../types";

function word(rank: number, w: string): EssentialWord {
  return { rank, word: w, pos: "noun", ipa_strong: `/${w}/`, example_sentence: `I like ${w} today.`, cefr_level: "A1" };
}
function words(n: number, prefix = "w"): EssentialWord[] {
  return Array.from({ length: n }, (_, i) => word(i + 1, `${prefix}${i + 1}`));
}

describe("estimateDurationMs", () => {
  it("estimates from expose + exercise counts", () => {
    const ms = estimateDurationMs({ exposeCount: 3, exerciseCount: 9 });
    expect(ms).toBe(3 * SECONDS_PER_EXPOSE * 1000 + 9 * SECONDS_PER_EXERCISE * 1000);
  });
});

describe("truncateToTimeBudget — reviews survive before new words (invariant 12)", () => {
  it("with more items than fit, review words are kept whole and new words are cut first", () => {
    const reviews = words(20, "rev");
    const fresh = words(20, "new");
    const result = truncateToTimeBudget({ reviewWords: reviews, newWords: fresh, budgetMs: SESSION_BUDGET_MS });
    expect(result.reviewWords.length).toBe(reviews.length);
    expect(result.newWords.length).toBeLessThan(fresh.length);
  });

  it("never keeps a new-word count of 1 or 2 (invariant 13) across a sweep of tiny budgets", () => {
    for (const budgetMs of [1, 500, 1000, 5000, 10000, 20000]) {
      const result = truncateToTimeBudget({ reviewWords: [], newWords: words(13, "new"), budgetMs });
      expect(result.newWords.length === 0 || result.newWords.length >= 3).toBe(true);
    }
  });

  it("does not truncate when everything fits comfortably within the budget", () => {
    const result = truncateToTimeBudget({ reviewWords: [], newWords: words(10, "new"), budgetMs: SESSION_BUDGET_MS });
    expect(result.newWords.length).toBe(10);
  });

  it("property: review count is never reduced while any new word survives at the same budget", () => {
    const reviews = words(15, "rev");
    const fresh = words(15, "new");
    for (const budgetMs of [500, 2000, 8000, 20000, 60000, SESSION_BUDGET_MS]) {
      const result = truncateToTimeBudget({ reviewWords: reviews, newWords: fresh, budgetMs });
      if (result.newWords.length > 0) {
        expect(result.reviewWords.length).toBe(reviews.length);
      }
    }
  });
});

describe("chunkReviews — spec §1.3: >15 due reviews split for interleaving between blocks", () => {
  it("returns a single chunk when at or below the threshold", () => {
    expect(chunkReviews(words(REVIEW_CHUNK_THRESHOLD, "rev")).length).toBe(1);
  });

  it("splits into multiple chunks above the threshold, covering every review exactly once", () => {
    const chunks = chunkReviews(words(20, "rev"));
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.flat().length).toBe(20);
    expect(REVIEW_CHUNK_SIZE).toBeLessThan(20);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/essential-words/__tests__/session-plan-time-ceiling.test.ts`
Expected: FAIL — cannot resolve `../session-plan-time-ceiling`.

- [ ] **Step 3: Write the implementation**

Create `lib/essential-words/session-plan-time-ceiling.ts`:

```ts
// Time-ceiling estimation and truncation (spec §4.1). Pure — no I/O. The
// hook calls truncateToTimeBudget before handing words to session-plan.ts's
// createSessionPlan, so the state machine never sees more than fits.

import type { EssentialWord } from "./types";

/** Rough per-step timing, seconds. Deliberately conservative — spec notes
 *  10 new words x 3-4 exercises + reviews is "easily 60-70 items". */
export const SECONDS_PER_EXPOSE = 4;
export const SECONDS_PER_EXERCISE = 12;

/** Target session window, spec §4.1: 8-12 min. The low end is used as the
 *  hard budget so sessions err short rather than long. */
export const SESSION_BUDGET_MS = 8 * 60 * 1000;

/** Above this many due reviews, split into chunks interleaved between blocks
 *  (spec §1.3) so attention isn't front-loaded before the costlier new material. */
export const REVIEW_CHUNK_THRESHOLD = 15;
export const REVIEW_CHUNK_SIZE = 10;

export interface DurationInput {
  exposeCount: number;
  exerciseCount: number;
}

export function estimateDurationMs({ exposeCount, exerciseCount }: DurationInput): number {
  return exposeCount * SECONDS_PER_EXPOSE * 1000 + exerciseCount * SECONDS_PER_EXERCISE * 1000;
}

/** Per-new-word cost: 1 exposure + 3 exercises (levels 1-3). */
function perNewWordMs(): number {
  return estimateDurationMs({ exposeCount: 1, exerciseCount: 3 });
}
/** Per-review-word cost: no exposure, up to 3 exercises (level-3 gated off
 *  by default in Fase A, but estimated at full cost so the budget stays
 *  correct once the level-3 flag flips in Fase B without re-deriving this). */
function perReviewWordMs(): number {
  return estimateDurationMs({ exposeCount: 0, exerciseCount: 3 });
}

export interface TruncateInput {
  reviewWords: EssentialWord[];
  newWords: EssentialWord[];
  budgetMs: number;
}

export interface TruncateResult {
  reviewWords: EssentialWord[];
  newWords: EssentialWord[];
}

/** Largest block-safe prefix count (matching session-plan-blocks.ts's
 *  blockSizes: never 1 or 2) that is <= maxCount. */
function blockSafeCount(maxCount: number): number {
  if (maxCount < 3) return 0;
  const mod = maxCount % 3;
  if (mod === 2) return maxCount - 2 >= 0 ? maxCount - 2 : 0; // avoid a trailing 2
  return maxCount;
}

/**
 * Truncate `newWords` (never `reviewWords`) to fit `budgetMs`. Reviews are
 * never cut by this function — a per-session review cap is applied upstream
 * by the caller (spec §1.3: "techo propio para repasos por sesión"), not
 * here, so this function's only job is protecting review priority over new.
 * The surviving new-word count is always block-safe (0, or >= 3 forming
 * valid block sizes per blockSafeCount).
 */
export function truncateToTimeBudget({ reviewWords, newWords, budgetMs }: TruncateInput): TruncateResult {
  const reviewCost = reviewWords.length * perReviewWordMs();
  const remaining = Math.max(0, budgetMs - reviewCost);
  const affordableNewCount = Math.floor(remaining / perNewWordMs());
  const safeCount = blockSafeCount(Math.min(affordableNewCount, newWords.length));
  return {
    reviewWords,
    newWords: newWords.slice(0, safeCount),
  };
}

/**
 * Split `reviews` into chunks of REVIEW_CHUNK_SIZE when above
 * REVIEW_CHUNK_THRESHOLD (spec §1.3), so the hook can interleave chunks
 * between blocks of new material instead of front-loading all reviews first.
 */
export function chunkReviews(reviews: EssentialWord[]): EssentialWord[][] {
  if (reviews.length <= REVIEW_CHUNK_THRESHOLD) return [reviews];
  const chunks: EssentialWord[][] = [];
  for (let i = 0; i < reviews.length; i += REVIEW_CHUNK_SIZE) {
    chunks.push(reviews.slice(i, i + REVIEW_CHUNK_SIZE));
  }
  return chunks;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/essential-words/__tests__/session-plan-time-ceiling.test.ts`
Expected: PASS.

If the block-safety sweep fails, cross-check `blockSafeCount` here against `blockSizes` in `session-plan-blocks.ts` for the same count — they must agree on which counts are valid, or a truncated batch could still hand `buildBlocks` an invalid trailing size.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/session-plan-time-ceiling.ts lib/essential-words/__tests__/session-plan-time-ceiling.test.ts
git commit -m "feat(essential-words): add time-ceiling estimation and review-priority truncation"
```

---

### Task 5: Simulation-level integration tests (spec §7.3, invariants 10–13)

**Files:**
- Create: `lib/essential-words/__tests__/session-plan-simulation.test.ts`

Spec §7.3 explicitly separates these from the pure property tests in Tasks 2–4 because they need `session-plan.ts` and `session-plan-time-ceiling.ts` orchestrated together — the spec's own warning is that they "tienden a quedarse sin test" if not deliberately isolated.

- [ ] **Step 1: Write the test**

Create `lib/essential-words/__tests__/session-plan-simulation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createSessionPlan, nextStep, applyResult } from "../session-plan";
import { truncateToTimeBudget, SESSION_BUDGET_MS } from "../session-plan-time-ceiling";
import { essentialWordId } from "../types";
import type { EssentialWord } from "../types";

function word(rank: number, w: string): EssentialWord {
  return {
    rank, word: w, pos: "noun", ipa_strong: `/${w}/`,
    example_sentence: `We really enjoyed the ${w} at the market yesterday.`,
    cefr_level: "A1", meaning: `meaning-${w}`, translation: `trad-${w}`,
  };
}
function words(n: number, prefix = "w"): EssentialWord[] {
  return Array.from({ length: n }, (_, i) => word(i + 1, `${prefix}${i + 1}`));
}

describe("simulation — one grade write per word per session (invariant 10)", () => {
  it("each word's first exercise attempt at a given level is unambiguously distinguishable from later reinsertion attempts", () => {
    const ws = words(3);
    const allWords = new Map(ws.map((w) => [essentialWordId(w.word), w]));
    let state = createSessionPlan(ws, 1);
    const firstAttemptSeen = new Set<string>();
    const ordinals: { wordId: string; level: number; ordinal: "first" | "repair" }[] = [];
    for (let i = 0; i < 200; i++) {
      const step = nextStep(state, allWords);
      if (!step) break;
      if (step.kind === "expose") {
        state = applyResult(state, { wordId: essentialWordId(step.word.word), level: 1, correct: true }, "expose");
        continue;
      }
      const id = essentialWordId(step.word.word);
      const key = `${id}:${step.level}`;
      const isFirst = !firstAttemptSeen.has(key);
      firstAttemptSeen.add(key);
      ordinals.push({ wordId: id, level: step.level, ordinal: isFirst ? "first" : "repair" });
      state = applyResult(state, { wordId: id, level: step.level, correct: true });
    }
    const firsts = ordinals.filter((a) => a.ordinal === "first");
    const seen = new Set<string>();
    for (const f of firsts) {
      const key = `${f.wordId}:${f.level}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});

describe("simulation — time ceiling prioritizes reviews over new when truncating (invariant 12)", () => {
  it("with far more items than fit, all reviews survive and the truncated new-word set still yields valid blocks", () => {
    const reviews = words(30, "rev");
    const fresh = words(30, "new");
    const result = truncateToTimeBudget({ reviewWords: reviews, newWords: fresh, budgetMs: SESSION_BUDGET_MS });
    expect(result.reviewWords.length).toBe(30);
    expect(result.newWords.length).toBeLessThan(30);

    const state = createSessionPlan(result.newWords, 1);
    for (const b of state.blocks) {
      expect([3, 4]).toContain(b.wordIds.length);
    }
  });
});

describe("simulation — truncation respects minimum block size (invariant 13)", () => {
  it("an extremely tight budget drops new words to 0 rather than starting a block of 1 or 2", () => {
    const result = truncateToTimeBudget({ reviewWords: words(5, "rev"), newWords: words(5, "new"), budgetMs: 1 });
    expect(result.newWords.length === 0 || result.newWords.length >= 3).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run lib/essential-words/__tests__/session-plan-simulation.test.ts`
Expected: PASS immediately — Tasks 3 and 4 already implement the behavior this task verifies; this task's purpose is closing the missing test-category gap spec §7.3 calls out, not adding new production code. If it FAILS, it reveals a real disagreement between `session-plan.ts` and `session-plan-time-ceiling.ts` (e.g. `blockSafeCount` vs `blockSizes`) — fix the mismatch in whichever module is wrong.

- [ ] **Step 3: Commit**

```bash
git add lib/essential-words/__tests__/session-plan-simulation.test.ts
git commit -m "test(essential-words): add session simulation tests for spec §7.3 invariants 10-13"
```

---

### Task 6: Review-log extension — `srsRatingEvents` gains `essential_words`

**Files:**
- Modify: `lib/db/index.ts`
- Test: `lib/db/__tests__/essential-words-review-log.test.ts`

- [ ] **Step 1: Check the current Dexie version number and existing test conventions**

Run:
```bash
grep -n "this.version(" lib/db/index.ts | tail -5
ls lib/db/__tests__/ 2>&1 | head -10
```

Note the highest version number printed — the bump in Step 3 below uses `N+1`. If a `lib/db/__tests__/` directory already exists, open one existing file there to confirm the Dexie test-double setup (look for `fake-indexeddb` in its imports) and mirror it exactly; do not introduce a second convention.

- [ ] **Step 2: Write the failing test**

Create `lib/db/__tests__/essential-words-review-log.test.ts` (adjust the `fake-indexeddb` import line if Step 1 found a different established pattern):

```ts
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db, recordEssentialWordsReviewEvent } from "@/lib/db";

describe("srsRatingEvents — essential_words entityType", () => {
  beforeEach(async () => {
    await db.srsRatingEvents.clear();
  });

  it("recordEssentialWordsReviewEvent writes a row with entityType essential_words and the new fields", async () => {
    await recordEssentialWordsReviewEvent({
      userId: "user-1",
      wordId: "c1k:the",
      grade: 4,
      stability: 6,
      difficulty: 5,
      elapsedDays: 3,
      state: "review",
      hintsUsed: 0,
      latencyMs: 4200,
      isRepair: false,
    });

    const rows = await db.srsRatingEvents.where("userId").equals("user-1").toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      userId: "user-1",
      entityType: "essential_words",
      entityId: "c1k:the",
      grade: 4,
      stability: 6,
      difficulty: 5,
      elapsedDays: 3,
      state: "review",
      hintsUsed: 0,
      latencyMs: 4200,
      isRepair: false,
      status: "pending",
    });
    expect(typeof rows[0].id).toBe("string");
    expect(typeof rows[0].occurredAt).toBe("string");
  });

  it("isRepair defaults to false when not specified", async () => {
    await recordEssentialWordsReviewEvent({
      userId: "user-1", wordId: "c1k:be", grade: 5,
      stability: 1, difficulty: 5, elapsedDays: 0, state: "new", hintsUsed: 0, latencyMs: 1000,
    });
    const rows = await db.srsRatingEvents.where("userId").equals("user-1").toArray();
    expect(rows[0].isRepair).toBe(false);
  });

  it("existing word_bank/topic_srs rows are unaffected by the new optional fields", async () => {
    await db.srsRatingEvents.add({
      id: "evt-1", userId: "user-1", entityType: "word_bank", entityId: "wb-1",
      grade: 4, occurredAt: new Date().toISOString(), status: "pending", createdAt: new Date().toISOString(),
    });
    const row = await db.srsRatingEvents.get("evt-1");
    expect(row?.stability).toBeUndefined();
    expect(row?.entityType).toBe("word_bank");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/db/__tests__/essential-words-review-log.test.ts`
Expected: FAIL — `entityType: "essential_words"` is not a valid literal yet, and `recordEssentialWordsReviewEvent` is not exported.

- [ ] **Step 4: Extend `SRSRatingEventRecord` and bump the Dexie version**

In `lib/db/index.ts`, find the `SRSRatingEventRecord` interface (search for `export interface SRSRatingEventRecord`) and replace it:

```ts
/**
 * One immutable rating submission, mirrored locally so it can be enqueued to
 * the outbox and replayed against the corresponding RPC without a network
 * read.
 *
 * `id` doubles as the RPC's idempotency key — generate with
 * crypto.randomUUID() at creation time, never regenerate on retry.
 *
 * `essential_words` (Fase A, essential-words-learning-sessions design §3.3):
 * the ONLY irreconstructible data ahead of the SM2->FSRS migration (Fase C),
 * so it is written starting in Fase A even though nothing schedules from it
 * yet. The extra fields below are optional so word_bank/topic_srs rows are
 * unaffected. `grade` reuses the existing SM-2 quality 0-5 scale for
 * essential_words rows too — Fase C's FSRS migration interprets it against
 * the new stability/difficulty/elapsedDays/state fields; this phase only
 * logs, it does not schedule anything from this data.
 */
export interface SRSRatingEventRecord {
  /** Idempotency key — PK. Passed verbatim as p_idempotency_key to the RPC. */
  id: string;
  userId: string;
  entityType: "word_bank" | "topic_srs" | "essential_words";
  /** word_bank: required. topic_srs: undefined. essential_words: the c1k: wordId. */
  entityId?: string;
  /** topic_srs: required (natural key). word_bank / essential_words: undefined. */
  topic?: string;
  /** SM-2 quality 0-5 today for all entity types. */
  grade: number;
  occurredAt: string; // ISO
  evaluatorMetadata?: Record<string, unknown>;
  /** Local submission bookkeeping — separate from the outbox's own status. */
  status: "pending" | "applied";
  createdAt: string; // ISO

  // --- essential_words only (Fase A, spec §3.3) — all optional so existing
  // word_bank/topic_srs rows and readers are unaffected. ---
  /** FSRS stability estimate at the moment of this review (undefined pre-Fase-C). */
  stability?: number;
  /** FSRS difficulty estimate at the moment of this review (1-10 scale). */
  difficulty?: number;
  /** Days since the previous review of this word, observed at review time. */
  elapsedDays?: number;
  /** State *before* this review was applied. */
  state?: "new" | "learning" | "review" | "relearning";
  /** Priced hint-ladder steps used on the graded attempt (spec §2.3) — free
   *  steps (e.g. unlimited dictation audio replay) never increment this. */
  hintsUsed?: number;
  /** Time to first submitted answer, milliseconds. */
  latencyMs?: number;
  /** True for a reparación attempt (spec §2.2 rule 2) — never carries a
   *  clean grade, excluded from the Fase C optimizer regardless of anything else. */
  isRepair?: boolean;
}
```

Then add the version bump. Locate the highest existing `this.version(N)` block (from Step 1) and add immediately after it, before the class's constructor body ends:

```ts
    // vN+1: essential_words entityType + FSRS-precursor fields on
    // srsRatingEvents (Fase A, essential-words-learning-sessions-design
    // §3.3). Purely additive — no index/store-shape change, since new
    // optional fields don't require a new .stores() key list. Bumped for
    // schema-history traceability.
    this.version(N + 1).stores({
      srsRatingEvents: 'id, userId, status, [userId+status], [userId+entityType+entityId], [userId+entityType+topic]',
    });
```

Replace `N + 1` with the actual next integer found in Step 1 (e.g. if the highest existing version was 28, this is `this.version(29)`), and copy the exact `srsRatingEvents` index-string value from the current highest version block rather than retyping it from memory.

- [ ] **Step 5: Add the `recordEssentialWordsReviewEvent` helper**

In `lib/db/index.ts`, add near the other `essentialWords*` helper functions:

```ts
export interface EssentialWordsReviewEventInput {
  userId: string;
  wordId: string; // c1k:-prefixed
  grade: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  state: "new" | "learning" | "review" | "relearning";
  hintsUsed: number;
  latencyMs: number;
  isRepair?: boolean;
}

/**
 * Writes one essential_words review-log row (spec §3.3). Fire-and-forget:
 * never blocks or reschedules anything — Fase A does not wire this into any
 * scheduler (that is Fase C). This is purely the irreconstructible log.
 */
export async function recordEssentialWordsReviewEvent(input: EssentialWordsReviewEventInput): Promise<void> {
  await db.srsRatingEvents.add({
    id: crypto.randomUUID(),
    userId: input.userId,
    entityType: "essential_words",
    entityId: input.wordId,
    grade: input.grade,
    occurredAt: new Date().toISOString(),
    status: "pending",
    createdAt: new Date().toISOString(),
    stability: input.stability,
    difficulty: input.difficulty,
    elapsedDays: input.elapsedDays,
    state: input.state,
    hintsUsed: input.hintsUsed,
    latencyMs: input.latencyMs,
    isRepair: input.isRepair ?? false,
  });
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run lib/db/__tests__/essential-words-review-log.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 7: Run the full db suite for regressions**

Run: `npx vitest run lib/db`
Expected: PASS, no regressions from the version bump.

- [ ] **Step 8: Type-check**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 9: Commit**

```bash
git add lib/db/index.ts lib/db/__tests__/essential-words-review-log.test.ts
git commit -m "feat(essential-words): extend srsRatingEvents with essential_words entityType (spec §3.3 review log)"
```

---

### Task 7: `essentialWordProgress` table — pre-graduation intermediate state

**Files:**
- Create: `lib/essential-words/essential-word-progress.ts`
- Test: `lib/essential-words/__tests__/essential-word-progress.test.ts`
- Modify: `lib/db/index.ts`
- Test: `lib/db/__tests__/essential-word-progress-store.test.ts`

- [ ] **Step 1: Write the failing test for the pure `resumeState` function**

Create `lib/essential-words/__tests__/essential-word-progress.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resumeState, RESUMPTION_WINDOW_DAYS } from "../essential-word-progress";
import type { EssentialWordProgressRecord } from "../essential-word-progress";

const DAY_MS = 24 * 60 * 60 * 1000;
const BASE_AT = "2026-06-01T00:00:00.000Z";

function record(overrides: Partial<EssentialWordProgressRecord> = {}): EssentialWordProgressRecord {
  return {
    wordId: "c1k:the", userId: "user-1",
    exposedAt: BASE_AT, highestLevel: 0, lastLevelAt: BASE_AT,
    lastSessionId: "session-1", attempts: 0,
    ...overrides,
  };
}

function daysAfterBase(n: number): Date {
  return new Date(new Date(BASE_AT).getTime() + n * DAY_MS);
}

describe("resumeState — spec §4.3 resumption table", () => {
  it("exposed, 0 exercises, within 14 days: abbreviated exposure + practice from level 1", () => {
    const decision = resumeState(record({ highestLevel: 0 }), daysAfterBase(5));
    expect(decision).toEqual({ kind: "abbreviated_exposure", fromLevel: 1 });
  });

  it("exposed, 0 exercises, past 14 days: full exposure as if new", () => {
    const decision = resumeState(record({ highestLevel: 0 }), daysAfterBase(20));
    expect(decision).toEqual({ kind: "full_exposure" });
  });

  it("level 1 reached, within 14 days: no exposure, resume at level 2", () => {
    const decision = resumeState(record({ highestLevel: 1 }), daysAfterBase(10));
    expect(decision).toEqual({ kind: "resume_no_exposure", fromLevel: 2 });
  });

  it("level 2 reached, within 14 days: no exposure, resume at level 3", () => {
    const decision = resumeState(record({ highestLevel: 2 }), daysAfterBase(10));
    expect(decision).toEqual({ kind: "resume_no_exposure", fromLevel: 3 });
  });

  it("level 1-2 reached, past 14 days: full exposure, record archived", () => {
    const decision = resumeState(record({ highestLevel: 2 }), daysAfterBase(15));
    expect(decision).toEqual({ kind: "full_exposure", archive: true });
  });

  it("level 3 reached without final round, within 14 days: no exposure, straight to final round", () => {
    const decision = resumeState(record({ highestLevel: 3 }), daysAfterBase(1));
    expect(decision).toEqual({ kind: "resume_final_round" });
  });

  it("level 3 reached without final round, past 14 days: full exposure, record archived", () => {
    const decision = resumeState(record({ highestLevel: 3 }), daysAfterBase(30));
    expect(decision).toEqual({ kind: "full_exposure", archive: true });
  });

  it("boundary: exactly 14 days is still within the window", () => {
    const decision = resumeState(record({ highestLevel: 1 }), daysAfterBase(RESUMPTION_WINDOW_DAYS));
    expect(decision.kind).toBe("resume_no_exposure");
  });

  it("boundary: 14 days + 1ms is past the window", () => {
    const now = new Date(daysAfterBase(RESUMPTION_WINDOW_DAYS).getTime() + 1);
    const decision = resumeState(record({ highestLevel: 1 }), now);
    expect(decision.kind).toBe("full_exposure");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/essential-words/__tests__/essential-word-progress.test.ts`
Expected: FAIL — cannot resolve `../essential-word-progress`.

- [ ] **Step 3: Write the pure implementation**

Create `lib/essential-words/essential-word-progress.ts`:

```ts
// Pre-graduation intermediate state (spec §4.2/§4.3). Pure resumption-decision
// logic — no Dexie import here, so it's trivially unit-testable. The Dexie
// read/write wrapper lives in lib/db/index.ts.

/** Resumption window, spec §4.3: past this, natural forgetting makes the
 *  progress-so-far irrelevant and the word is treated as never touched. */
export const RESUMPTION_WINDOW_DAYS = 14;

export interface EssentialWordProgressRecord {
  wordId: string;
  userId: string;
  exposedAt: string; // ISO — saw the presentation card
  highestLevel: 0 | 1 | 2 | 3; // level reached; 0 = exposed only, no exercises yet
  lastLevelAt: string; // ISO — when highestLevel was reached; decides expiry
  lastSessionId: string;
  attempts: number; // cumulative hintsUsed across attempts (spec §4.2)
}

export type ResumptionDecision =
  | { kind: "full_exposure"; archive?: true }
  | { kind: "abbreviated_exposure"; fromLevel: 1 }
  | { kind: "resume_no_exposure"; fromLevel: 1 | 2 | 3 }
  | { kind: "resume_final_round" };

function withinWindow(record: EssentialWordProgressRecord, now: Date): boolean {
  const lastLevelAt = new Date(record.lastLevelAt).getTime();
  const elapsedMs = now.getTime() - lastLevelAt;
  return elapsedMs <= RESUMPTION_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Decide how to resume a word with pre-graduation progress, per spec §4.3:
 *
 * | Estado                     | <14 días                          | >=14 días                |
 * |-----------------------------|------------------------------------|---------------------------|
 * | Expuesta, 0 ejercicios       | abbreviated_exposure + nivel 1     | full_exposure             |
 * | Nivel 1-2 alcanzado           | resume_no_exposure at level+1      | full_exposure, archive    |
 * | Nivel 3 sin ronda final       | resume_final_round                 | full_exposure, archive    |
 */
export function resumeState(record: EssentialWordProgressRecord, now: Date): ResumptionDecision {
  const inWindow = withinWindow(record, now);

  if (record.highestLevel === 0) {
    return inWindow ? { kind: "abbreviated_exposure", fromLevel: 1 } : { kind: "full_exposure" };
  }

  if (record.highestLevel === 1 || record.highestLevel === 2) {
    if (!inWindow) return { kind: "full_exposure", archive: true };
    return { kind: "resume_no_exposure", fromLevel: (record.highestLevel + 1) as 2 | 3 };
  }

  // highestLevel === 3: production reached, final round not yet done.
  if (!inWindow) return { kind: "full_exposure", archive: true };
  return { kind: "resume_final_round" };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/essential-words/__tests__/essential-word-progress.test.ts`
Expected: PASS — 9 tests.

- [ ] **Step 5: Commit the pure module**

```bash
git add lib/essential-words/essential-word-progress.ts lib/essential-words/__tests__/essential-word-progress.test.ts
git commit -m "feat(essential-words): add essentialWordProgress resumption logic (spec §4.3)"
```

- [ ] **Step 6: Write the failing test for the Dexie table + wrapper functions**

Create `lib/db/__tests__/essential-word-progress-store.test.ts` (mirror the `fake-indexeddb` setup confirmed in Task 6 Step 1):

```ts
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db, getEssentialWordProgress, saveEssentialWordProgress, archiveEssentialWordProgress } from "@/lib/db";

describe("essentialWordProgress table", () => {
  beforeEach(async () => {
    await db.essentialWordProgress.clear();
  });

  it("saveEssentialWordProgress writes a row and getEssentialWordProgress reads it back", async () => {
    await saveEssentialWordProgress({
      wordId: "c1k:the", userId: "user-1", exposedAt: "2026-06-01T00:00:00.000Z",
      highestLevel: 1, lastLevelAt: "2026-06-01T00:00:00.000Z", lastSessionId: "s1", attempts: 2,
    });
    const row = await getEssentialWordProgress("c1k:the", "user-1");
    expect(row).toMatchObject({ wordId: "c1k:the", userId: "user-1", highestLevel: 1, attempts: 2 });
  });

  it("getEssentialWordProgress returns undefined for an unknown word", async () => {
    expect(await getEssentialWordProgress("c1k:nope", "user-1")).toBeUndefined();
  });

  it("saveEssentialWordProgress overwrites the existing row for the same word+user", async () => {
    await saveEssentialWordProgress({
      wordId: "c1k:the", userId: "user-1", exposedAt: "2026-06-01T00:00:00.000Z",
      highestLevel: 1, lastLevelAt: "2026-06-01T00:00:00.000Z", lastSessionId: "s1", attempts: 1,
    });
    await saveEssentialWordProgress({
      wordId: "c1k:the", userId: "user-1", exposedAt: "2026-06-01T00:00:00.000Z",
      highestLevel: 2, lastLevelAt: "2026-06-02T00:00:00.000Z", lastSessionId: "s2", attempts: 3,
    });
    const row = await getEssentialWordProgress("c1k:the", "user-1");
    expect(row?.highestLevel).toBe(2);
    expect(row?.attempts).toBe(3);
  });

  it("archiveEssentialWordProgress deletes the row", async () => {
    await saveEssentialWordProgress({
      wordId: "c1k:the", userId: "user-1", exposedAt: "2026-06-01T00:00:00.000Z",
      highestLevel: 3, lastLevelAt: "2026-06-01T00:00:00.000Z", lastSessionId: "s1", attempts: 0,
    });
    await archiveEssentialWordProgress("c1k:the", "user-1");
    expect(await getEssentialWordProgress("c1k:the", "user-1")).toBeUndefined();
  });

  it("scopes rows by userId — two users' progress on the same word do not collide", async () => {
    await saveEssentialWordProgress({
      wordId: "c1k:the", userId: "user-1", exposedAt: "2026-06-01T00:00:00.000Z",
      highestLevel: 1, lastLevelAt: "2026-06-01T00:00:00.000Z", lastSessionId: "s1", attempts: 0,
    });
    await saveEssentialWordProgress({
      wordId: "c1k:the", userId: "user-2", exposedAt: "2026-06-01T00:00:00.000Z",
      highestLevel: 3, lastLevelAt: "2026-06-01T00:00:00.000Z", lastSessionId: "s2", attempts: 0,
    });
    expect((await getEssentialWordProgress("c1k:the", "user-1"))?.highestLevel).toBe(1);
    expect((await getEssentialWordProgress("c1k:the", "user-2"))?.highestLevel).toBe(3);
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run lib/db/__tests__/essential-word-progress-store.test.ts`
Expected: FAIL — `db.essentialWordProgress` is undefined; the three helper functions are not exported.

- [ ] **Step 8: Add the table, version bump, and wrapper functions**

In `lib/db/index.ts`, add the interface near `SRSRatingEventRecord`:

```ts
/**
 * Pre-graduation intermediate state (spec §4.2). Deliberately distinct from
 * SRSData: this exists ONLY before graduation. On graduation, the scheduler
 * row is created and this record is archived (deleted) — see
 * archiveEssentialWordProgress.
 */
export interface EssentialWordProgressRecord {
  /** PK: `${userId}:${wordId}` */
  id: string;
  wordId: string;
  userId: string;
  exposedAt: string;
  highestLevel: 0 | 1 | 2 | 3;
  lastLevelAt: string;
  lastSessionId: string;
  attempts: number;
}
```

Add the table declaration inside `class PronunciationDB` alongside the other `Table<...>` declarations:

```ts
  essentialWordProgress!: Table<EssentialWordProgressRecord, string>;
```

Add the version bump after Task 6's bump (check the version number Task 6 actually used, and increment from there — do not hardcode a number without verifying against the current file):

```ts
    // vN+2: essentialWordProgress table — pre-graduation intermediate state
    // (Fase A, spec §4.2). Local-only for now; RLS is mandatory if/when this
    // ever syncs to Supabase, which is out of scope for Fase A.
    this.version(N + 2).stores({
      essentialWordProgress: 'id, userId, wordId, [userId+wordId], lastLevelAt',
    });
```

Add the wrapper functions near the other `essentialWords*` helpers:

```ts
function essentialWordProgressId(wordId: string, userId: string): string {
  return `${userId}:${wordId}`;
}

/** Pre-graduation progress for one word, or undefined if none/graduated/archived. */
export async function getEssentialWordProgress(
  wordId: string,
  userId: string,
): Promise<EssentialWordProgressRecord | undefined> {
  return db.essentialWordProgress.get(essentialWordProgressId(wordId, userId));
}

/** Upserts pre-graduation progress. Overwrites any existing row for this word+user. */
export async function saveEssentialWordProgress(
  record: Omit<EssentialWordProgressRecord, "id">,
): Promise<void> {
  await db.essentialWordProgress.put({
    ...record,
    id: essentialWordProgressId(record.wordId, record.userId),
  });
}

/** Removes the pre-graduation record — called on graduation (spec §4.2) and
 *  on resumption past the 14-day window (spec §4.3, resumeState "archive"). */
export async function archiveEssentialWordProgress(wordId: string, userId: string): Promise<void> {
  await db.essentialWordProgress.delete(essentialWordProgressId(wordId, userId));
}
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npx vitest run lib/db/__tests__/essential-word-progress-store.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 10: Run the full db + essential-words suites for regressions**

Run: `npx vitest run lib/db lib/essential-words`
Expected: PASS, no regressions.

- [ ] **Step 11: Type-check**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 12: Commit**

```bash
git add lib/db/index.ts lib/db/__tests__/essential-word-progress-store.test.ts
git commit -m "feat(essential-words): add essentialWordProgress Dexie table (spec §4.2)"
```

---

### Task 8: Level-3 feature flag

**Files:**
- Create: `lib/essential-words/level3-flag.ts`
- Test: `lib/essential-words/__tests__/level3-flag.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/essential-words/__tests__/level3-flag.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ESSENTIAL_WORDS_LEVEL3_ENABLED, gateLevel3Mode } from "../level3-flag";
import type { Step } from "../session-plan-types";

const exerciseWord = {
  rank: 1, word: "the", pos: "article" as const, ipa_strong: "/ðə/",
  example_sentence: "The end.", cefr_level: "A1" as const,
};

describe("level3-flag", () => {
  it("is a boolean constant, off by default with no env var set", () => {
    expect(typeof ESSENTIAL_WORDS_LEVEL3_ENABLED).toBe("boolean");
  });

  it("gateLevel3Mode caps a level-3 exercise step down to level 2 when the flag is off", () => {
    const step: Step = { kind: "exercise", word: exerciseWord, level: 3, mode: "cloze_sentence" };
    const result = gateLevel3Mode(step, false);
    expect(result.kind === "exercise" && result.level).toBe(2);
  });

  it("gateLevel3Mode passes level 1-2 exercise steps through unchanged regardless of the flag", () => {
    const level1: Step = { kind: "exercise", word: exerciseWord, level: 1, mode: "recognize_translation" };
    const level2: Step = { kind: "exercise", word: exerciseWord, level: 2, mode: "recall_translation" };
    expect((gateLevel3Mode(level1, false) as { level: number }).level).toBe(1);
    expect((gateLevel3Mode(level2, false) as { level: number }).level).toBe(2);
  });

  it("gateLevel3Mode passes level 3 through unchanged when the flag is on", () => {
    const step: Step = { kind: "exercise", word: exerciseWord, level: 3, mode: "cloze_sentence" };
    expect((gateLevel3Mode(step, true) as { level: number }).level).toBe(3);
  });

  it("gateLevel3Mode passes an expose step through unchanged regardless of the flag", () => {
    const step: Step = { kind: "expose", word: exerciseWord };
    expect(gateLevel3Mode(step, false)).toEqual(step);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/essential-words/__tests__/level3-flag.test.ts`
Expected: FAIL — cannot resolve `../level3-flag`.

- [ ] **Step 3: Write the implementation**

Create `lib/essential-words/level3-flag.ts`:

```ts
// Level-3 (production) gate. Per spec "Fases A y B se despliegan juntas":
// Fase A builds block structure, the state machine, and the review log, but
// a bare production exercise with no hints/feedback (Fase B) is a UX
// regression, so level 3 stays dark until Fase B ships alongside it. Simple
// boolean constant — this codebase has no generic feature-flag system and
// doesn't need one for a single on/off gate.
//
// IMPORTANT: this flag being false does not make Fase A shippable alone. See
// the spec's "Fases A y B se despliegan juntas" section — without level 3, no
// new word ever reaches graduation, the review queue dries up, and the app
// stops teaching. Fase A remains internal/dev-only regardless of this flag's
// value until Fase B lands.
export const ESSENTIAL_WORDS_LEVEL3_ENABLED =
  process.env.NEXT_PUBLIC_ESSENTIAL_WORDS_LEVEL3 === "true";

import type { Step } from "./session-plan-types";

/**
 * When the flag is off, cap a level-3 exercise step down to level 2 so block
 * practice still terminates sensibly. This is the single choke point that
 * enforces the gate — nothing downstream needs its own flag check.
 */
export function gateLevel3Mode(step: Step, enabled: boolean): Step {
  if (enabled || step.kind !== "exercise" || step.level !== 3) return step;
  return { ...step, level: 2 };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/essential-words/__tests__/level3-flag.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/level3-flag.ts lib/essential-words/__tests__/level3-flag.test.ts
git commit -m "feat(essential-words): add level-3 feature flag gating production exercises until Fase B"
```

---

### Task 9: Hook integration, step 1 — parity harness (old queue vs. new plan)

**Files:**
- Create: `hooks/__tests__/useEssentialWordsSession.session-plan-parity.test.ts`

Before touching the hook itself, prove the new engine covers the same word set as the old flat queue for representative inputs. This is a standalone test file — zero regression risk to existing behavior.

- [ ] **Step 1: Confirm the current hook/component test suite is green (baseline)**

Run: `npx vitest run components/practice/essential-words hooks`
Expected: PASS. Record the total test count — Task 11's final gate compares against this number.

- [ ] **Step 2: Write the parity test**

Check whether `hooks/__tests__/` exists:

```bash
ls hooks/__tests__/ 2>&1 | head -5
```

Create `hooks/__tests__/useEssentialWordsSession.session-plan-parity.test.ts` (create the directory if Step above showed it doesn't exist):

```ts
import { describe, expect, it } from "vitest";
import { buildSessionQueue } from "@/lib/essential-words/queue";
import { createSessionPlan, nextStep, applyResult } from "@/lib/essential-words/session-plan";
import { essentialWordId } from "@/lib/essential-words/types";
import type { EssentialWord } from "@/lib/essential-words/types";

function word(rank: number, w: string): EssentialWord {
  return {
    rank, word: w, pos: "noun", ipa_strong: `/${w}/`,
    example_sentence: `We saw the ${w} near the old station today.`,
    cefr_level: "A1", meaning: `meaning-${w}`, translation: `trad-${w}`,
  };
}
function words(n: number): EssentialWord[] {
  return Array.from({ length: n }, (_, i) => word(i + 1, `word${i + 1}`));
}

describe("parity — old flat queue vs. new session-plan engine cover the same word set", () => {
  it("both engines eventually touch every 'new' word from buildSessionQueue's fresh list", () => {
    const ws = words(10);
    const oldQueue = buildSessionQueue({
      words: ws, srsEntries: [], introducedToday: [], now: new Date("2026-01-01T00:00:00.000Z"),
    });
    const oldWordIds = new Set(oldQueue.map((i) => essentialWordId(i.entry.word)));

    const allWords = new Map(ws.map((w) => [essentialWordId(w.word), w]));
    let state = createSessionPlan(ws, 1);
    const newWordIds = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const step = nextStep(state, allWords);
      if (!step) break;
      const id = essentialWordId(step.word.word);
      newWordIds.add(id);
      state = step.kind === "expose"
        ? applyResult(state, { wordId: id, level: 1, correct: true }, "expose")
        : applyResult(state, { wordId: id, level: step.level, correct: true });
    }

    expect(newWordIds).toEqual(oldWordIds);
  });
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run hooks/__tests__/useEssentialWordsSession.session-plan-parity.test.ts`
Expected: PASS. If it FAILS, the two engines disagree on which words are in scope — do not proceed to Task 11's cutover until this is green; the hook must not silently drop or add words relative to today's behavior.

- [ ] **Step 4: Commit**

```bash
git add hooks/__tests__/useEssentialWordsSession.session-plan-parity.test.ts
git commit -m "test(essential-words): add old-vs-new engine parity harness before hook cutover"
```

---

### Task 10: Hook integration, step 2 — stage imports behind an internal flag

**Files:**
- Modify: `hooks/useEssentialWordsSession.ts`

Do not attempt the full cutover in one step. This task only adds the new engine's imports and an internal, off-by-default constant, without changing any externally observable behavior.

- [ ] **Step 1: Add a local, hook-internal constant**

In `hooks/useEssentialWordsSession.ts`, add near the top-level constants (after `EMPTY_COUNTS`):

```ts
/**
 * Internal-only toggle for the Fase A block-based engine (session-plan.ts).
 * Not exported, not user-facing, not the same as ESSENTIAL_WORDS_LEVEL3_ENABLED
 * — this exists only so Task 11's cutover can be reviewed as its own commit
 * once this task's imports are already in place and type-checked clean.
 */
const USE_SESSION_PLAN_ENGINE = false;
void USE_SESSION_PLAN_ENGINE; // referenced by Task 11's cutover; unused here by design
```

- [ ] **Step 2: Add the imports**

Add near the top of `hooks/useEssentialWordsSession.ts`, alongside the existing `lib/essential-words/*` imports:

```ts
import {
  createSessionPlan,
  nextStep as planNextStep,
  applyResult as planApplyResult,
  deriveCounts as derivePlanCounts,
  removeWord as removeWordFromPlan,
  appendWords as appendWordsToPlan,
  type SessionState as PlanSessionState,
} from "@/lib/essential-words/session-plan";
import type { Step as PlanStep } from "@/lib/essential-words/session-plan-types";
import { truncateToTimeBudget, SESSION_BUDGET_MS } from "@/lib/essential-words/session-plan-time-ceiling";
import { ESSENTIAL_WORDS_LEVEL3_ENABLED, gateLevel3Mode } from "@/lib/essential-words/level3-flag";
```

- [ ] **Step 3: Run the type-check and full test suite to confirm zero behavior change**

Run: `pnpm type-check`
Expected: exit 0. (An "unused variable" ESLint warning on the new imports is expected and resolved by Task 11's wiring — do not silence it with a disable comment here.)

Run: `npx vitest run components/practice/essential-words hooks`
Expected: PASS, identical test count to Task 9 Step 1's baseline.

- [ ] **Step 4: Commit**

```bash
git add hooks/useEssentialWordsSession.ts
git commit -m "chore(essential-words): stage session-plan engine imports (no behavior change)"
```

---

### Task 11: Hook integration, step 3 — cut the hook over to `session-plan.ts`

**Files:**
- Modify: `hooks/useEssentialWordsSession.ts`
- Modify: `components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx` (only if a case asserts on the internal `queue`/`index` shape directly — the hook's public return values must not change)

Replaces the flat `queue`/`index` state with `session-plan.ts`-driven state, preserving every other behavior: lapse persistence, `finishSession`/sync-outbox, `archiveWord`/`keepSnooze`/`masterWord`, `learnMore`, `setLevels`/`setRoute` filtering.

- [ ] **Step 1: Write a non-regression test for the existing exposure-then-practice order**

Append to `components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx` (inside the existing top-level `describe`):

```tsx
it('renders the exposure phase before any exercise for a batch of new words (Fase A block structure)', async () => {
  dbMocks.getEssentialWordsSrsEntries.mockResolvedValue([])
  dbMocks.getEssentialWordsIntroducedToday.mockResolvedValue([])

  render(<EssentialWordsSession />)

  expect(await screen.findByText(WORDS[0].word)).toBeTruthy()
})
```

This asserts on existing behavior that holds under both engines (`phase === 'study'` shows `WordStudyCard` first) — it's a non-regression guard, not a new-feature test.

- [ ] **Step 2: Run test to verify it currently passes (baseline, before the cutover)**

Run: `npx vitest run components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx`
Expected: PASS.

- [ ] **Step 3: Replace `queue`/`index` state with plan-driven state**

In `hooks/useEssentialWordsSession.ts`, replace:

```ts
  const [queue, setQueue] = useState<EssentialWordQueueItem[]>([]);
  const [index, setIndex] = useState(0);
```

with:

```ts
  const [planState, setPlanState] = useState<PlanSessionState | null>(null);
  const wordsByIdRef = useRef<Map<string, EssentialWord>>(new Map());
  const [currentStep, setCurrentStep] = useState<PlanStep | null>(null);
```

Remove the `USE_SESSION_PLAN_ENGINE` constant and its `void` line added in Task 10 — this task supersedes it; do not leave dead flag code behind.

- [ ] **Step 4: Rewrite `bootstrap`**

Replace `bootstrap`'s body (the part after `loadEssentialWordsQueue` resolves) with:

```ts
  const bootstrap = useCallback(async () => {
    const { items, stats: nextStats, allWords, seenIds } =
      await loadEssentialWordsQueue(levelsRef.current, posRef.current, user?.id);
    finishingRef.current = false;
    allWordsRef.current = allWords;
    seenIdsRef.current = seenIds;

    const reviewWords = items.filter((i) => i.kind !== "new").map((i) => i.entry);
    const newWordsAll = items.filter((i) => i.kind === "new").map((i) => i.entry);
    const { reviewWords: keptReviews, newWords: keptNew } = truncateToTimeBudget({
      reviewWords, newWords: newWordsAll, budgetMs: SESSION_BUDGET_MS,
    });
    const planWords = [...keptReviews, ...keptNew];
    wordsByIdRef.current = new Map(planWords.map((w) => [essentialWordId(w.word), w]));
    const nextPlanState = planWords.length > 0 ? createSessionPlan(planWords, Date.now()) : null;
    const first = nextPlanState ? planNextStep(nextPlanState, wordsByIdRef.current) : null;

    setPlanState(nextPlanState);
    setCurrentStep(first);
    setStats(nextStats);
    setSessionSummary(null);
    sessionResultsRef.current = [];
    pendingLapsesRef.current = new Map();
    persistPendingLapses();
    setPreviousMode(undefined);
    if (nextPlanState) setCounts(derivePlanCounts(nextPlanState));
    setPhase(first ? (first.kind === "expose" ? "study" : "speak") : "empty");
  }, [persistPendingLapses, user?.id]);
```

Remove the now-unused `syncCounts` callback if nothing else calls it after this change (check with a search before deleting).

- [ ] **Step 5: Rewrite `startSpeak`**

Replace:

```ts
  const startSpeak = useCallback(() => setPhase("speak"), []);
```

with:

```ts
  const startSpeak = useCallback(() => {
    if (!planState || !currentStep || currentStep.kind !== "expose") {
      setPhase("speak");
      return;
    }
    const wordId = essentialWordId(currentStep.word.word.toLowerCase());
    const nextPlanState = planApplyResult(planState, { wordId, level: 1, correct: true }, "expose");
    const next = planNextStep(nextPlanState, wordsByIdRef.current);
    setPlanState(nextPlanState);
    setCurrentStep(next);
    setCounts(derivePlanCounts(nextPlanState));
    if (!next) { void finishSession(); return; }
    setPhase(next.kind === "expose" ? "study" : "speak");
  }, [planState, currentStep, finishSession]);
```

- [ ] **Step 6: Rewrite `submitGrade`**

Replace `submitGrade`'s body with:

```ts
  const submitGrade = useCallback(
    async (quality: number, extras?: GradeExtras) => {
      if (!planState || !currentStep || currentStep.kind !== "exercise") return;
      const wordId = essentialWordId(currentStep.word.word.toLowerCase());
      const result = buildEssentialWordExerciseResult(
        { entry: currentStep.word, kind: "review" }, quality, extras, currentModeRef.current,
      );
      setPreviousMode(currentModeRef.current);

      const correct = quality >= 3;
      if (correct) {
        await gradeEssentialWord(currentStep.word.word, quality, extras, user?.id);
        seenIdsRef.current.add(wordId);
        pendingLapsesRef.current.delete(wordId);
        persistPendingLapses();
        if (currentStep.level === 1) {
          await recordEssentialWordIntroduction(currentStep.word.word.toLowerCase(), user?.id);
          setStats((s) => ({ ...s, newToday: s.newToday + 1 }));
        }
        sessionResultsRef.current.push(result);
        setSessionSummary((prev) => advanceSummary(prev, true));
      } else {
        seenIdsRef.current.add(wordId);
        pendingLapsesRef.current.set(wordId, quality);
        persistPendingLapses();
        sessionResultsRef.current.push(result);
        setSessionSummary((prev) => advanceSummary(prev, false));
      }

      const nextPlanState = planApplyResult(planState, { wordId, level: currentStep.level, correct });
      const next = planNextStep(nextPlanState, wordsByIdRef.current);
      setPlanState(nextPlanState);
      setCurrentStep(next);
      setCounts(derivePlanCounts(nextPlanState));
      if (!next) { void finishSession(); return; }
      setPhase(next.kind === "expose" ? "study" : "speak");
    },
    [planState, currentStep, persistPendingLapses, user?.id, finishSession],
  );
```

> Note: the old code's `if (item.kind === "new")` newToday-increment check becomes `if (currentStep.level === 1)` — the closest equivalent under the new engine, since "new" no longer exists as a queue-item kind (every word passes through level 1 whether it's a first encounter or a review). If this changes the `newToday` stat's semantics in a way the existing `SessionStatsCard` test suite catches, prefer tracking "was this word's first-ever level-1 attempt in this session" via a small `Set<string>` ref instead, and use that to gate the increment — do not silently change the stat's meaning without a passing test proving the new logic matches the old one's intent (new words introduced today).

- [ ] **Step 7: Rewrite `current`, `currentMode`, and `distractorPool` derivations**

Replace:

```ts
  const current = queue[index] ?? null;
  const currentMode: EssentialWordMode = current
    ? selectMode(current, previousMode)
    : "speak_sentence";
```

with:

```ts
  const gatedStep = currentStep ? gateLevel3Mode(currentStep, ESSENTIAL_WORDS_LEVEL3_ENABLED) : null;
  const current: EssentialWordQueueItem | null = gatedStep
    ? {
        entry: gatedStep.word,
        kind: "review" as const,
        repetitions: gatedStep.kind === "exercise" ? gatedStep.level - 1 : undefined,
      }
    : null;
  const currentMode: EssentialWordMode = gatedStep && gatedStep.kind === "exercise"
    ? gatedStep.mode
    : current
      ? selectMode(current, previousMode)
      : "speak_sentence";
```

Replace:

```ts
  const distractorPool = queue
    .filter((_, i) => i !== index)
    .map((qi) => qi.entry);
```

with:

```ts
  const distractorPool = Array.from(wordsByIdRef.current.values()).filter(
    (w) => w.word !== current?.entry.word,
  );
```

- [ ] **Step 8: Rewrite `removeCurrentAndAdvance`, `learnMore`**

Replace `removeCurrentAndAdvance`:

```ts
  const removeCurrentAndAdvance = useCallback((word: string) => {
    if (!planState) return;
    const wordId = essentialWordId(word.toLowerCase());
    seenIdsRef.current.add(wordId);
    const nextPlanState = removeWordFromPlan(planState, wordId);
    const next = planNextStep(nextPlanState, wordsByIdRef.current);
    setPlanState(nextPlanState);
    setCurrentStep(next);
    setCounts(derivePlanCounts(nextPlanState));
    if (!next) { void finishSession(); return; }
    setPhase(next.kind === "expose" ? "study" : "speak");
  }, [planState, finishSession]);
```

Replace `learnMore`:

```ts
  const learnMore = useCallback(() => {
    if (!planState) return;
    const inPlanIds = new Set(wordsByIdRef.current.keys());
    const batch = allWordsRef.current
      .filter((w) => {
        const id = essentialWordId(w.word);
        if (seenIdsRef.current.has(id) || inPlanIds.has(id)) return false;
        return matchesFilter(w, levelsRef.current, posRef.current);
      })
      .slice(0, NEW_CARDS_PER_DAY);
    if (batch.length === 0) return;
    for (const w of batch) wordsByIdRef.current.set(essentialWordId(w.word), w);
    const nextPlanState = appendWordsToPlan(planState, batch, Date.now());
    setPlanState(nextPlanState);
    setCounts(derivePlanCounts(nextPlanState));
    if (!currentStep) {
      const next = planNextStep(nextPlanState, wordsByIdRef.current);
      setCurrentStep(next);
      if (next) setPhase(next.kind === "expose" ? "study" : "speak");
    }
  }, [planState, currentStep]);
```

Add the `matchesFilter` import from `@/lib/essential-words/queue` if not already imported (it already exists there and is exported — reuse it, do not duplicate the filter logic).

- [ ] **Step 9: Remove now-dead imports**

Search the file for `reinsertLearning`, `deriveCounts` (the old one from `@/lib/essential-words/queue`), `appendNewBatch`, and `phaseForEssentialWordItem`. Remove any that are no longer referenced anywhere in the file — check each with a search first, since `phaseForEssentialWordItem` or others might still be used by a code path this task didn't touch (e.g. re-exports at the top of the file).

- [ ] **Step 10: Run the full essential-words hook + component suite**

Run: `npx vitest run hooks components/practice/essential-words lib/essential-words`
Expected: PASS. Compare the total test count against Task 9 Step 1's baseline — equal or greater. If an existing `EssentialWordsSession.test.tsx` case fails on a user-visible assertion (phase transitions, `dbMocks.saveSRSData`/`recordEssentialWordIntroduction`/`snoozeEssentialWord`/`masterEssentialWord` calls, `learnMore` appending words), do not adjust the assertion — find and fix the real behavioral gap in the rewritten hook functions above.

- [ ] **Step 11: Type-check**

Run: `pnpm type-check`
Expected: exit 0.

- [ ] **Step 12: Lint**

Run: `npx eslint hooks/useEssentialWordsSession.ts lib/essential-words`
Expected: exit 0. If `hooks/useEssentialWordsSession.ts` exceeds ~300 lines after this change, extract the plan-state derivation logic (`gatedStep`/`current`/`currentMode`/`distractorPool` computation) into a small colocated `hooks/useEssentialWordsSession.derive.ts` helper module rather than letting the hook file grow past the project's ESLint warning threshold.

- [ ] **Step 13: Commit**

```bash
git add hooks/useEssentialWordsSession.ts components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx
git commit -m "feat(essential-words): cut hook over to session-plan.ts block-based engine"
```

---

### Task 12: Final verification — regressions across everything this phase promised not to touch

**Files:** none new — verification-only, with fixes only if a gap is found.

- [ ] **Step 1: Run the full essential-words related suite**

Run: `npx vitest run hooks components/practice/essential-words lib/essential-words lib/db`
Expected: PASS, all files.

- [ ] **Step 2: Specifically re-run tests covering behaviors this phase promised not to touch**

Run:
```bash
npx vitest run --reporter=verbose -t "snooze" components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx
npx vitest run --reporter=verbose -t "master" components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx
npx vitest run --reporter=verbose -t "learn" components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx
```

Expected: all PASS, confirming `archiveWord`/`masterWord`/`learnMore` still work end to end through the new engine.

- [ ] **Step 3: Verify pending-lapse persistence is untouched**

Run: `npx vitest run lib/essential-words/__tests__/pending-lapses.test.ts`
Expected: PASS — this module was not modified by any task in this plan.

- [ ] **Step 4: Full repo test run**

Run: `npx vitest run`
Expected: PASS, no new failures anywhere in the repo.

- [ ] **Step 5: Dataset validation gate (unaffected — no dataset changes in this phase)**

Run: `pnpm validate:essential-words`
Expected: PASS.

- [ ] **Step 6: Commit any fixes found**

```bash
git status
```

If clean, no commit needed. If fixes were required, commit them with a message naming which invariant/behavior was broken and how it was fixed.

---

## Self-Review

**Spec §1/§4 requirement-to-task mapping:**

| Spec item | Task |
|---|---|
| §1.1 blocks of 3-4, exact redistribution | Task 2 |
| §1.2 block anatomy (exposure then leveled practice) | Task 3 |
| §1.3 reviews-before-new priority, review chunking >15 | Task 4 (`chunkReviews`), Task 5 |
| §1.4 final mixed production round | Task 3 (`finalRoundStep`) |
| §1.5 level ladder + monotonicity invariant | Task 3 (`nextPendingInBlock`) |
| §1.6 elegibility/degradation via `modeHasData`/`selectMode` | Reused directly from `exercise-modes.ts` in Task 3 — no new eligibility logic written, per spec's instruction not to rebuild it |
| §1.7 sequencing (distance ≥2), reinsertion cap, termination | Task 3 |
| §1.8 pure `nextStep`/`applyResult`, seeded, no I/O | Task 3 |
| §3.3 review log | Task 6 |
| §4.1 time ceiling, min block size, block-boundary cuts | Task 4 |
| §4.2 `essentialWordProgress` table | Task 7 |
| §4.3 14-day resumption window | Task 7 (`resumeState`) |
| §7.1 invariant 1 (dataset coverage) | Already satisfied by Fase 0 — confirmed, no new task needed |
| §7.2 invariants 2-9 (pure property tests) | Tasks 2, 3 |
| §7.3 invariants 10-13 (simulation) | Task 5 |
| §7.4 invariants 14-15 (real-log-only) | Explicitly out of automated-test scope per spec's own classification — not gated by CI here |
| Level-3 gate / A-B joint deployment | Task 8, plus the "not shippable alone" note below |

**Known scope boundary, not an oversight:** `resumeState` (Task 7) is implemented and unit-tested but **not yet wired into `bootstrap`/`submitGrade`** in Task 11 — the hook does not call `getEssentialWordProgress`/`saveEssentialWordProgress`/`resumeState` to special-case a resumed word's exposure, and `recordEssentialWordsReviewEvent` (Task 6) is not called from `submitGrade` either. Both are deliberate: wiring pre-graduation progress persistence and the review log into the live grading path is a second integration surface on top of the cutover in Tasks 10–11, and doing it in the same task would make an already-large hook rewrite harder to review safely. **This is the first thing the Fase B implementation slice should pick up before building on top of the hook**, since Fase B's hints/feedback work will otherwise have no persisted mid-block state to resume into and no log rows to read latency/hint counts from.

**Placeholder-pattern scan:** no `TODO`, `TBD`, "similar to above", or "add appropriate handling" strings in any task's code. Every code block is complete and runnable as written.

**Type/signature consistency check:**
- `Step`/`SessionState`/`Block`/`AttemptResult` (Task 1) used identically in Tasks 3, 5, 9, 11 — no renaming drift.
- `createSessionPlan(words, seed)`, `nextStep(state, allWords)`, `applyResult(state, result, phase?)` (Task 3) signatures match every call site in Tasks 5, 9, 11.
- `truncateToTimeBudget({ reviewWords, newWords, budgetMs })` → `{ reviewWords, newWords }` (Task 4) is consistent in Task 5 and Task 11's `bootstrap`.
- `deriveCounts`/`removeWord`/`appendWords` (added directly inside Task 3's `session-plan.ts`, not a separate task, correcting an earlier draft that scattered them into the hook-cutover task) are imported with alias names (`derivePlanCounts`, `removeWordFromPlan`, `appendWordsToPlan`) in Task 11 specifically to avoid colliding with `queue.ts`'s same-named `deriveCounts`/`appendNewBatch` still imported elsewhere in the hook file — this aliasing is applied consistently in every Task 11 step.
- `gateLevel3Mode(step, enabled)` (Task 8) takes the full `Step` (not a bare `{level}` object) so it round-trips a `Step` back out — matches its one call site in Task 11 Step 7.

---

## Verification

- [ ] `npx vitest run` passes with no new failures
- [ ] `pnpm type-check` exits 0
- [ ] `npx eslint lib/essential-words hooks/useEssentialWordsSession.ts components/practice/essential-words` exits 0
- [ ] `pnpm validate:essential-words` passes (dataset gate, unaffected by this phase)
- [ ] Property tests for termination (`session-plan.test.ts`) pass across every seed/N exercised
- [ ] `git log --oneline` shows one commit per task above, each green at commit time
- [ ] Manual check: `ESSENTIAL_WORDS_LEVEL3_ENABLED` is `false` by default (no env var set) — confirm level-3 exercises do not render in a local `pnpm dev` session after this phase merges

**This phase is not shippable to users alone.** Per the spec's "Fases A y B se despliegan juntas": Fase A builds block structure, the state machine, the time ceiling, and the review log, but gates level 3 behind `ESSENTIAL_WORDS_LEVEL3_ENABLED` because a production exercise without Fase B's hints/feedback is a UX regression — without it, no new word ever reaches graduation, the review queue dries up, and the app stops teaching for as long as the A→B gap lasts. Fase A is internal/dev-only until Fase B lands in the same release. Two integration gaps are deliberately left for the Fase B slice (see Self-Review): wiring `essential-word-progress.ts`'s resumption logic into the hook, and wiring `recordEssentialWordsReviewEvent` into the grading path.
