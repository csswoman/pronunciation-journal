import { describe, expect, it } from "vitest";
import {
  currentLevelStatus,
  displayLevelProgress,
  levelMilestoneMessage,
  levelProgressBarSegments,
  tallyLevelProgress,
  type LevelProgress,
} from "../level-progress";
import { essentialWordId, type EssentialWord } from "../types";

function word(rank: number, w: string, cefr: EssentialWord["cefr_level"]): EssentialWord {
  return {
    rank, word: w, pos: "noun", ipa_strong: `/${w}/`,
    example_sentence: `A ${w} here.`, cefr_level: cefr,
  };
}

const WORDS = [
  word(1, "cat", "A1"),
  word(2, "sun", "A1"),
  word(3, "dog", "A2"),
  word(4, "run", "B1"),
];

describe("tallyLevelProgress", () => {
  it("returns one row per CEFR level, ordered A1 → C1", () => {
    const rows = tallyLevelProgress(WORDS, new Set());
    expect(rows.map((r) => r.level)).toEqual(["A1", "A2", "B1", "B2", "C1"]);
  });

  it("counts totals and learned per level", () => {
    const learned = new Set([essentialWordId("cat"), essentialWordId("run")]);
    const rows = tallyLevelProgress(WORDS, learned);
    const byLevel = Object.fromEntries(rows.map((r) => [r.level, r]));
    expect(byLevel.A1).toMatchObject({ learned: 1, total: 2 });
    expect(byLevel.A2).toMatchObject({ learned: 0, total: 1 });
    expect(byLevel.B1).toMatchObject({ learned: 1, total: 1 });
    expect(byLevel.B2).toMatchObject({ learned: 0, total: 0 });
  });
});

describe("currentLevelStatus / displayLevelProgress", () => {
  const rows: LevelProgress[] = [
    { level: "A1", learned: 2, total: 740 },
    { level: "A2", learned: 0, total: 645 },
    { level: "B1", learned: 0, total: 524 },
    { level: "B2", learned: 0, total: 754 },
    { level: "C1", learned: 0, total: 137 },
  ];

  it("names the level where the learner is parked", () => {
    expect(currentLevelStatus(rows)).toBe("Vas por A1 · 2 de 740");
  });

  it("keeps the frontier and collapses the unstarted streak", () => {
    expect(displayLevelProgress(rows)).toEqual([
      { kind: "level", level: "A1", learned: 2, total: 740 },
      { kind: "level", level: "A2", learned: 0, total: 645 },
      { kind: "collapsed", from: "B1", to: "C1" },
    ]);
  });
});

describe("levelProgressBarSegments / levelMilestoneMessage", () => {
  const rows: LevelProgress[] = [
    { level: "A1", learned: 654, total: 740 },
    { level: "A2", learned: 0, total: 645 },
    { level: "B1", learned: 0, total: 524 },
    { level: "B2", learned: 0, total: 754 },
    { level: "C1", learned: 0, total: 137 },
  ];

  it("builds proportional segments with the current frontier partially filled", () => {
    expect(levelProgressBarSegments(rows)).toEqual([
      {
        level: "A1",
        total: 740,
        learned: 654,
        fillRatio: 654 / 740,
        state: "current",
      },
      {
        level: "A2",
        total: 645,
        learned: 0,
        fillRatio: 0,
        state: "upcoming",
      },
      {
        level: "B1",
        total: 524,
        learned: 0,
        fillRatio: 0,
        state: "upcoming",
      },
      {
        level: "B2",
        total: 754,
        learned: 0,
        fillRatio: 0,
        state: "upcoming",
      },
      {
        level: "C1",
        total: 137,
        learned: 0,
        fillRatio: 0,
        state: "upcoming",
      },
    ]);
  });

  it("names the remaining words for the current level", () => {
    expect(levelMilestoneMessage(rows)).toBe(
      "Te faltan 86 palabras para completar el nivel A1",
    );
  });
});
