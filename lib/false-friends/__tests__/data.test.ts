import { describe, expect, it } from "vitest";
import { filterByLevel, normalizeFalseFriendsLevel, rotateByDay } from "../data";
import { falseFriendId } from "../types";
import type { FalseFriend } from "../types";

function entry(id: string, cefr_level: FalseFriend["cefr_level"]): FalseFriend {
  return {
    id,
    word: id,
    looksLike: "x",
    actualMeaning: "y",
    correctWord: "z",
    kind: "meaning-shift",
    cefr_level,
    prompts: [{ sentence: "___ here", options: [id, "z"], answer: 0, explain: "…" }],
  };
}

describe("filterByLevel", () => {
  const all = [entry("a", "A1"), entry("b", "B1"), entry("c", "C1")];

  it("keeps entries at or below the ceiling", () => {
    expect(filterByLevel(all, "B1").map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("keeps everything at C1", () => {
    expect(filterByLevel(all, "C1")).toHaveLength(3);
  });

  it("keeps only A1 for a beginner", () => {
    expect(filterByLevel(all, "A1").map((e) => e.id)).toEqual(["a"]);
  });
});

describe("rotateByDay", () => {
  const all = [entry("a", "A1"), entry("b", "A1"), entry("c", "A1"), entry("d", "A1")];

  it("returns the requested count", () => {
    expect(rotateByDay(all, 0, 2)).toHaveLength(2);
  });

  it("starts at a different offset on a different day", () => {
    expect(rotateByDay(all, 0, 2).map((e) => e.id)).toEqual(["a", "b"]);
    expect(rotateByDay(all, 1, 2).map((e) => e.id)).toEqual(["b", "c"]);
  });

  it("wraps around the end of the list", () => {
    expect(rotateByDay(all, 3, 2).map((e) => e.id)).toEqual(["d", "a"]);
  });

  it("is deterministic for the same day", () => {
    expect(rotateByDay(all, 7, 3)).toEqual(rotateByDay(all, 7, 3));
  });

  it("never returns more than it has", () => {
    expect(rotateByDay(all, 0, 99)).toHaveLength(4);
  });

  it("handles an empty bank", () => {
    expect(rotateByDay([], 3, 5)).toEqual([]);
  });
});

describe("normalizeFalseFriendsLevel", () => {
  it("accepts a lowercase estimate", () => {
    expect(normalizeFalseFriendsLevel("b2")).toBe("B2");
  });

  it("passes an already-valid level through", () => {
    expect(normalizeFalseFriendsLevel("A1")).toBe("A1");
  });

  it("folds C2 into C1 because the bank tops out there", () => {
    expect(normalizeFalseFriendsLevel("C2")).toBe("C1");
  });

  it("defaults to B1 when there is no estimate", () => {
    expect(normalizeFalseFriendsLevel(undefined)).toBe("B1");
    expect(normalizeFalseFriendsLevel(null)).toBe("B1");
  });

  it("defaults to B1 on an unrecognized value", () => {
    expect(normalizeFalseFriendsLevel("fluent")).toBe("B1");
  });
});

describe("falseFriendId", () => {
  it("namespaces and lowercases", () => {
    expect(falseFriendId("Actually")).toBe("ff:actually");
  });

  it("does not collide with the core-1000 namespace", () => {
    expect(falseFriendId("the").startsWith("c1k:")).toBe(false);
  });
});
