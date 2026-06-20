import { describe, it, expect } from "vitest";
import { mergeVocabularyLearned } from "@/lib/vocabulary/progress";

describe("mergeVocabularyLearned", () => {
  it("sums both pools and caps at catalog total", () => {
    expect(mergeVocabularyLearned(100, 50, 3500)).toEqual({ learned: 150, percent: 4 });
  });

  it("does not exceed catalog total", () => {
    expect(mergeVocabularyLearned(2000, 2000, 3500)).toEqual({ learned: 3500, percent: 100 });
  });

  it("returns zero percent when catalog is empty", () => {
    expect(mergeVocabularyLearned(10, 5, 0)).toEqual({ learned: 0, percent: 0 });
  });
});
