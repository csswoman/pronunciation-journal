import { describe, expect, it } from "vitest";
import { reinsertLearning, deriveCounts } from "../queue";
import type { Core1000QueueItem } from "../queue";
import type { CoreWord } from "../types";

function word(rank: number, w: string): CoreWord {
  return {
    rank, word: w, pos: "noun", ipa_strong: `/${w}/`,
    example_sentence: `A ${w} here.`, cefr_level: "A1",
  };
}

function item(w: string, kind: Core1000QueueItem["kind"]): Core1000QueueItem {
  return { entry: word(1, w), kind };
}

describe("reinsertLearning", () => {
  it("inserts failed item at index + 3", () => {
    const queue = [
      item("a", "new"), item("b", "review"), item("c", "new"),
      item("d", "review"), item("e", "new"),
    ];
    const result = reinsertLearning(queue, 0, item("a", "new"));
    expect(result[3].entry.word).toBe("a");
    expect(result[3].kind).toBe("learning");
  });

  it("appends at end when queue is too short for index + 3", () => {
    const queue = [item("a", "new"), item("b", "review")];
    const result = reinsertLearning(queue, 0, item("a", "new"));
    expect(result[result.length - 1].entry.word).toBe("a");
    expect(result[result.length - 1].kind).toBe("learning");
  });

  it("does not mutate the original queue", () => {
    const queue = [item("a", "new"), item("b", "review"), item("c", "new")];
    const original = queue.map((i) => ({ ...i }));
    reinsertLearning(queue, 0, item("a", "new"));
    expect(queue).toEqual(original);
  });

  it("always tags reinserted item as learning regardless of original kind", () => {
    const queue = [item("a", "review"), item("b", "new"), item("c", "review"), item("d", "new")];
    const result = reinsertLearning(queue, 0, item("a", "review"));
    const reinserted = result.find((i) => i.entry.word === "a" && i !== queue[0]);
    expect(reinserted?.kind).toBe("learning");
  });
});

describe("deriveCounts", () => {
  it("counts remaining items from index onwards by kind", () => {
    const queue = [
      item("a", "new"),
      item("b", "review"),
      item("c", "learning"),
      item("d", "new"),
      item("e", "review"),
    ];
    expect(deriveCounts(queue, 1)).toEqual({
      newRemaining: 1,
      learningRemaining: 1,
      reviewRemaining: 2,
    });
  });

  it("returns zeros when index is at end of queue", () => {
    const queue = [item("a", "new")];
    expect(deriveCounts(queue, 1)).toEqual({
      newRemaining: 0,
      learningRemaining: 0,
      reviewRemaining: 0,
    });
  });

  it("counts all items when index is 0", () => {
    const queue = [item("a", "new"), item("b", "new"), item("c", "review")];
    expect(deriveCounts(queue, 0)).toEqual({
      newRemaining: 2,
      learningRemaining: 0,
      reviewRemaining: 1,
    });
  });
});
