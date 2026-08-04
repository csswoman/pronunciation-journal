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
