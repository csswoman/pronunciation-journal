import { describe, it, expect } from "vitest";
import { selectStarters } from "../select";
import type { StarterContext } from "../types";
import { createEmptyState } from "@/lib/ai-practice/learning-state";

const NOW = Date.parse("2026-09-05T12:00:00Z");

function ctx(overrides: Partial<StarterContext> = {}): StarterContext {
  return { state: null, level: "B1", interests: [], seed: 0, recentIds: [], recentAngles: [], now: NOW, ...overrides };
}

function weakState(errorRate = 0.7) {
  const s = createEmptyState("u1", "d1");
  return {
    ...s,
    grammar: {
      weakTopics: [
        { topic: "past-simple", errorRate, sampleCount: 5, lastCoveredAt: new Date(NOW).toISOString() },
      ],
    },
  };
}

describe("selectStarters", () => {
  it("always returns exactly four starters", () => {
    expect(selectStarters(ctx())).toHaveLength(4);
    expect(selectStarters(ctx({ state: weakState(), interests: ["gaming"] }))).toHaveLength(4);
  });

  it("gives a brand-new user learn plus free, with no broken promises", () => {
    const ids = selectStarters(ctx()).map((s) => s.id);
    expect(ids).toContain("learn");
    expect(ids).toContain("free");
    expect(ids).not.toContain("review");
  });

  it("never repeats a starter title within one selection", () => {
    const titles = selectStarters(ctx()).map((s) => s.title);
    expect(new Set(titles).size).toBe(titles.length);

    const richTitles = selectStarters(ctx({ state: weakState(), interests: ["gaming"] })).map((s) => s.title);
    expect(new Set(richTitles).size).toBe(richTitles.length);
  });

  it("always ends with the free starter", () => {
    const ids = selectStarters(ctx({ state: weakState(), interests: ["gaming"] })).map((s) => s.id);
    expect(ids[ids.length - 1]).toBe("free");

    const newIds = selectStarters(ctx()).map((s) => s.id);
    expect(newIds[newIds.length - 1]).toBe("free");
  });

  it("includes review once a topic is weak enough", () => {
    const ids = selectStarters(ctx({ state: weakState() })).map((s) => s.id);
    expect(ids).toContain("review");
  });

  it("includes world once interests are declared", () => {
    const ids = selectStarters(ctx({ interests: ["books"] })).map((s) => s.id);
    expect(ids).toContain("world");
  });

  it("pads with static shortcuts when fewer than three dynamic starters apply", () => {
    const starters = selectStarters(ctx());
    // learn + free are the only dynamic ones available; the rest are padding.
    expect(starters.filter((s) => s.id === "free")).toHaveLength(1);
    expect(starters).toHaveLength(4);
    expect(starters.map((s) => s.title)).toContain("Entrevista de trabajo");
  });

  it("produces different angles across seeds for the same user", () => {
    const state = weakState();
    const a = selectStarters(ctx({ state, seed: 0 })).map((s) => s.angle).join("|");
    const b = selectStarters(ctx({ state, seed: 3 })).map((s) => s.angle).join("|");
    expect(a).not.toBe(b);
  });

  it("is deterministic for the same seed and context", () => {
    const state = weakState();
    const a = selectStarters(ctx({ state, seed: 7 })).map((s) => s.prompt);
    const b = selectStarters(ctx({ state, seed: 7 })).map((s) => s.prompt);
    expect(a).toEqual(b);
  });
});
