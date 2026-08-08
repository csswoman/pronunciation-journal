import { describe, expect, it } from "vitest";
import { buildBlocks, blockSizes, leftoverWords } from "../session-plan-blocks";
import type { EssentialWord } from "../types";

function word(rank: number, w: string): EssentialWord {
  return { rank, word: w, pos: "noun", ipa_strong: `/${w}/`, example_sentence: `I see the ${w}.`, cefr_level: "A1" };
}
function words(n: number): EssentialWord[] {
  return Array.from({ length: n }, (_, i) => word(i + 1, `w${i + 1}`));
}

describe("blockSizes — spec §1.1 exact redistribution", () => {
  it("n % 3 == 0: all blocks of 3", () => {
    expect(blockSizes(9)).toEqual([3, 3, 3]);
  });

  it("n % 3 == 1 (n=10): 3+3+4", () => {
    expect(blockSizes(10)).toEqual([3, 3, 4]);
  });

  it("n % 3 == 1 (n=7): 3+4", () => {
    expect(blockSizes(7)).toEqual([3, 4]);
  });

  it("n % 3 == 2 (n=8): 4+4, never a trailing 2", () => {
    expect(blockSizes(8)).toEqual([4, 4]);
  });

  it("n % 3 == 2 (n=11): 3+4+4", () => {
    expect(blockSizes(11)).toEqual([3, 4, 4]);
  });

  it("n=3: [3]. n=4: [4]. n=5: no valid partition into 3s/4s only — treated as leftover-heavy, one block of 3 plus 2 leftover would violate 'never 2', so n=5 yields [3] with 2 leftover, or [4] with 1 leftover — must not produce a block of size other than 3 or 4", () => {
    expect(blockSizes(3)).toEqual([3]);
    expect(blockSizes(4)).toEqual([4]);
    const s5 = blockSizes(5);
    expect(s5.every((n) => n === 3 || n === 4)).toBe(true);
    expect(s5.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(5);
  });

  it("n=0, n=1, n=2: no blocks (below minimum)", () => {
    expect(blockSizes(0)).toEqual([]);
    expect(blockSizes(1)).toEqual([]);
    expect(blockSizes(2)).toEqual([]);
  });

  it("property: for all n in 0..60, every block is 3 or 4 and leftover is always < 3", () => {
    for (let n = 0; n <= 60; n++) {
      const sizes = blockSizes(n);
      for (const size of sizes) expect([3, 4]).toContain(size);
      const total = sizes.reduce((a, b) => a + b, 0);
      expect(n - total).toBeGreaterThanOrEqual(0);
      expect(n - total).toBeLessThan(3);
    }
  });
});

describe("buildBlocks", () => {
  it("N=10 -> 3 blocks sized 3,3,4, covering all 10 words", () => {
    const blocks = buildBlocks(words(10), 1);
    expect(blocks.map((b) => b.wordIds.length)).toEqual([3, 3, 4]);
    const allIds = blocks.flatMap((b) => b.wordIds);
    expect(new Set(allIds).size).toBe(10);
  });

  it("every word appears in exactly one block, in input order", () => {
    const ws = words(7);
    const blocks = buildBlocks(ws, 5);
    const flat = blocks.flatMap((b) => b.wordIds);
    expect(flat).toEqual(["c1k:w1", "c1k:w2", "c1k:w3", "c1k:w4", "c1k:w5", "c1k:w6", "c1k:w7"]);
  });

  it("is deterministic for a given seed", () => {
    const a = buildBlocks(words(10), 42);
    const b = buildBlocks(words(10), 42);
    expect(a.map((blk) => blk.wordIds)).toEqual(b.map((blk) => blk.wordIds));
  });

  it("initializes levelReached=0 and failCount=0 for every word, exposed empty", () => {
    const [block] = buildBlocks(words(3), 1);
    expect(block.levelReached).toEqual({ "c1k:w1": 0, "c1k:w2": 0, "c1k:w3": 0 });
    expect(block.failCount).toEqual({ "c1k:w1": 0, "c1k:w2": 0, "c1k:w3": 0 });
    expect(block.exposed.size).toBe(0);
  });

  it("N=1 or N=2: zero blocks", () => {
    expect(buildBlocks(words(1), 1)).toEqual([]);
    expect(buildBlocks(words(2), 1)).toEqual([]);
  });
});

describe("leftoverWords", () => {
  it("returns the words not included in any block", () => {
    const ws = words(2);
    expect(leftoverWords(ws)).toEqual(ws);
  });

  it("returns empty when N is fully blocked", () => {
    expect(leftoverWords(words(9))).toEqual([]);
  });
});
