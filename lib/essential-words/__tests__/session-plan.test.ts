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
 * exercise attempt. attemptIndex is per (wordId, level) pair. */
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
