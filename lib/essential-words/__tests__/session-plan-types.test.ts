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
