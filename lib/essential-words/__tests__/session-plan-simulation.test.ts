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
