import { describe, it, expect } from "vitest";
import { deriveEssentialSource } from "@/lib/essential-words/essential-due";
import type { EssentialWordQueueItem } from "@/lib/essential-words/queue";

function item(word: string, kind: EssentialWordQueueItem["kind"]): EssentialWordQueueItem {
  return {
    kind,
    entry: {
      word, rank: 1, cefr_level: "A1", ipa_strong: `/${word}/`,
      example_sentence: `An ${word}.`,
    } as EssentialWordQueueItem["entry"],
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
