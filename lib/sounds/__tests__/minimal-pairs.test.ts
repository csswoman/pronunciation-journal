import { describe, expect, it } from "vitest";
import {
  getMinimalPairsForPhoneme,
  minimalPairsRunnerHref,
} from "../minimal-pairs";

describe("minimal-pair runner selection", () => {
  it("uses only the pairs declared for the selected phoneme", () => {
    expect(getMinimalPairsForPhoneme("/æ/")).toEqual([
      { wordA: "cat", wordB: "cut", phonemeA: "/æ/", phonemeB: "/ʌ/" },
      { wordA: "bad", wordB: "bed", phonemeA: "/æ/", phonemeB: "/ɛ/" },
      { wordA: "man", wordB: "men", phonemeA: "/æ/", phonemeB: "/ɛ/" },
    ]);
  });

  it("normalizes the selected phoneme before resolving its pairs", () => {
    expect(getMinimalPairsForPhoneme("/ɡ/")).toEqual(
      getMinimalPairsForPhoneme("/g/"),
    );
  });

  it("builds a canonical preloaded route", () => {
    expect(minimalPairsRunnerHref("/ɡ/")).toBe(
      "/practice/sounds?tab=minimal-pairs&phoneme=%2Fg%2F",
    );
  });
});
