import { describe, it, expect } from "vitest";
import { mergeEssential } from "@/hooks/useMergedReviewQueue";
import type { ReviewQueueSummary } from "@/lib/home/constants";

const base: ReviewQueueSummary = {
  total: 3,
  newAvailable: 0,
  sources: [
    { id: "vocabulary", label: "Vocabulary", count: 3, href: "/practice/review", tone: "primary" },
  ],
  preview: [{ id: "w1", text: "alpha", ipa: null, translation: null, sourceId: "vocabulary" }],
};

describe("mergeEssential", () => {
  it("adds essential count to total and inserts a sorted source", () => {
    const merged = mergeEssential(base, {
      count: 8, newAvailable: 4,
      previewWords: [{ id: "core1k:run", text: "run", ipa: "/rʌn/", translation: null, sourceId: "essential" }],
    });
    expect(merged.total).toBe(11);
    expect(merged.newAvailable).toBe(4);
    expect(merged.sources.map((s) => s.id)).toEqual(["essential", "vocabulary"]);
    expect(merged.preview.some((p) => p.sourceId === "essential")).toBe(true);
  });

  it("omits the essential source when count is 0 but keeps newAvailable", () => {
    const merged = mergeEssential(base, { count: 0, newAvailable: 2, previewWords: [] });
    expect(merged.sources.map((s) => s.id)).toEqual(["vocabulary"]);
    expect(merged.newAvailable).toBe(2);
  });
});
