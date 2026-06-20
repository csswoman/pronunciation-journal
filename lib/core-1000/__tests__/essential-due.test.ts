import { describe, it, expect } from "vitest";
import { deriveEssentialSource } from "@/lib/core-1000/essential-due";
import type { Core1000QueueItem } from "@/lib/core-1000/queue";

function item(word: string, kind: Core1000QueueItem["kind"]): Core1000QueueItem {
  return {
    kind,
    entry: {
      word, rank: 1, cefr_level: "A1", ipa_strong: `/${word}/`,
      example_sentence: `An ${word}.`,
    } as Core1000QueueItem["entry"],
  };
}

describe("deriveEssentialSource", () => {
  it("counts only review items as due and new items as available", () => {
    const queue = [item("apple", "review"), item("bread", "review"), item("cat", "new")];
    const r = deriveEssentialSource(queue);
    expect(r.count).toBe(2);
    expect(r.newAvailable).toBe(1);
  });

  it("builds preview from due items, capped at limit", () => {
    const queue = [
      item("a", "review"), item("b", "review"),
      item("c", "review"), item("d", "review"),
    ];
    const r = deriveEssentialSource(queue, 3);
    expect(r.previewWords).toHaveLength(3);
    expect(r.previewWords[0]).toMatchObject({ text: "a", sourceId: "essential" });
  });

  it("returns zeros for an empty queue", () => {
    const r = deriveEssentialSource([]);
    expect(r).toEqual({ count: 0, newAvailable: 0, previewWords: [] });
  });
});
