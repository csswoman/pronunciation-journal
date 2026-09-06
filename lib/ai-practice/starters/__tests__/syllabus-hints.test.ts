import { describe, it, expect } from "vitest";
import { grammarTopicsForLevel, soundLabelsForLevel } from "../syllabus-hints";

describe("grammarTopicsForLevel", () => {
  it("returns real A1 syllabus titles", () => {
    const topics = grammarTopicsForLevel("A1");
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.length).toBeLessThanOrEqual(8);
    // The A1 course path teaches "to be" early — it should surface.
    expect(topics.join(" ").toLowerCase()).toMatch(/to be|am · is · are/);
  });

  it("drops topics the learner covered recently", () => {
    const all = grammarTopicsForLevel("A1", [], 20);
    const target = all[0].replace(/\s*\(.*\)$/, "");
    const filtered = grammarTopicsForLevel("A1", [target], 20);
    expect(filtered.some((t) => t.startsWith(target))).toBe(false);
  });

  it("respects the limit", () => {
    expect(grammarTopicsForLevel("B1", [], 3)).toHaveLength(3);
  });

  it("gives different content per level", () => {
    const a1 = grammarTopicsForLevel("A1").join("|");
    const c1 = grammarTopicsForLevel("C1").join("|");
    expect(a1).not.toBe(c1);
  });
});

describe("soundLabelsForLevel", () => {
  it("offers easy sounds at A1", () => {
    const labels = soundLabelsForLevel("A1");
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.join(" ")).toMatch(/b\/v|æ\/ʌ|R \(ɹ\)/);
  });

  it("A1 is a subset of C1 (cumulative by level)", () => {
    const a1 = soundLabelsForLevel("A1", 50);
    const c1 = soundLabelsForLevel("C1", 50);
    expect(c1.length).toBeGreaterThanOrEqual(a1.length);
    for (const label of a1) expect(c1).toContain(label);
  });
});
