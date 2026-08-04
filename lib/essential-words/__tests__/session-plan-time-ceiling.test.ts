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
