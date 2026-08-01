import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { filterByLevel, normalizeFalseFriendsLevel, rotateByDay } from "../data";
import { CEFR_LEVELS, falseFriendId } from "../types";
import type { CefrLevel, FalseFriend } from "../types";

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

// The suites above run on synthetic entries, so they prove the functions work
// but say nothing about whether the authored bank is actually usable. These do.
describe("the authored bank", () => {
  const dir = path.join(process.cwd(), "public", "false-friends");
  const entries: FalseFriend[] = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")).entries);

  it("is contiguously numbered, so the loader reaches every chunk", () => {
    // loadAllFalseFriends stops at the first gap: pairs-001, 003 would silently
    // drop 003 and everything after it.
    const numbers = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => Number(f.match(/pairs-(\d+)\.json/)?.[1]))
      .sort((a, b) => a - b);
    expect(numbers).toEqual(numbers.map((_, i) => i + 1));
  });

  it.each(CEFR_LEVELS)("has enough entries at %s to fill a daily step", (level) => {
    // A step asks for 4 pairs; a learner capped at A1 must still get a full one.
    expect(filterByLevel(entries, level as CefrLevel).length).toBeGreaterThanOrEqual(4);
  });

  it("drills both directions, so the trap word is not always wrong", () => {
    // Every pair with two prompts should have one where the trap word is the
    // answer — otherwise "never pick the familiar-looking word" wins every time.
    const twoPrompt = entries.filter((e) => e.prompts.length > 1);
    const bidirectional = twoPrompt.filter((e) =>
      e.prompts.some((p) => p.options[p.answer].toLowerCase().includes(e.word.toLowerCase())),
    );
    expect(bidirectional).toHaveLength(twoPrompt.length);
  });
});

describe("falseFriendId", () => {
  it("namespaces and lowercases", () => {
    expect(falseFriendId("Actually")).toBe("ff:actually");
  });

  it("does not collide with the essential-words namespace", () => {
    expect(falseFriendId("the").startsWith("c1k:")).toBe(false);
  });
});
