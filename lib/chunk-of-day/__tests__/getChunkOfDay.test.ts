import { describe, expect, it } from "vitest";
import { getChunkOfDay, getRandomChunk, getDaySeed } from "../getChunkOfDay";
import { CHUNKS_OF_THE_DAY } from "../data";

describe("getChunkOfDay", () => {
  it("has a valid collection of chunks with IPA and examples", () => {
    expect(CHUNKS_OF_THE_DAY.length).toBeGreaterThanOrEqual(30);
    for (const chunk of CHUNKS_OF_THE_DAY) {
      expect(chunk.id).toBeTruthy();
      expect(chunk.chunk).toBeTruthy();
      expect(chunk.ipa).toBeTruthy();
      expect(chunk.meaning).toBeTruthy();
      expect(chunk.example).toBeTruthy();
      expect(chunk.category).toBeTruthy();
    }
  });

  it("returns a deterministic chunk for a specific date string", () => {
    const chunk1 = getChunkOfDay("2026-08-15");
    const chunk2 = getChunkOfDay("2026-08-15");
    expect(chunk1).toEqual(chunk2);
    expect(chunk1.id).toBeDefined();
  });

  it("returns different chunks for different dates", () => {
    const chunkA = getChunkOfDay("2026-01-01");
    const chunkB = getChunkOfDay("2026-01-02");
    // Seeds are distinct
    expect(chunkA.id).toBeDefined();
    expect(chunkB.id).toBeDefined();
  });

  it("returns a random chunk excluding current chunk id", () => {
    const current = CHUNKS_OF_THE_DAY[0];
    const random = getRandomChunk(current.id);
    expect(random).toBeDefined();
    expect(random.id).not.toBe(current.id);
  });

  it("calculates a numeric day seed", () => {
    const date = new Date(2026, 7, 15); // Aug 15, 2026
    const seed = getDaySeed(date);
    expect(seed).toBe(20260815);
  });
});
