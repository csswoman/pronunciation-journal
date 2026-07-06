import { describe, expect, it } from "vitest";
import { getEvaluationWordResults } from "../word-results";
import type { EvaluationResult } from "@/lib/exercises/design";

const baseResult: EvaluationResult = {
  correct: true,
  category: "correct",
  errorCode: "correct",
  userAnswer: "test",
  expectedAnswer: "test",
  feedback: {
    immediate: "Good",
    explanation: "Matched",
  },
  gradedBy: "client",
};

describe("getEvaluationWordResults", () => {
  it("returns typed word results from extended evaluation results", () => {
    const result = {
      ...baseResult,
      wordResults: [{ expected: "test", got: "test", status: "correct" }],
    };

    expect(getEvaluationWordResults(result)).toEqual(result.wordResults);
  });

  it("returns an empty array for missing or invalid word results", () => {
    expect(getEvaluationWordResults(baseResult)).toEqual([]);
    expect(getEvaluationWordResults({ ...baseResult, wordResults: [{ expected: "x" }] } as never)).toEqual([]);
  });
});
