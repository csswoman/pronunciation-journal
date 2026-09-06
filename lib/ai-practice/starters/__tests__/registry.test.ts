import { describe, it, expect } from "vitest";
import { STARTERS, getStarter } from "../registry";
import type { StarterContext } from "../types";
import { createEmptyState } from "@/lib/ai-practice/learning-state";

const NOW = Date.parse("2026-09-05T12:00:00Z");

function ctx(overrides: Partial<StarterContext> = {}): StarterContext {
  return {
    state: null,
    level: "B1",
    interests: [],
    seed: 0,
    recentIds: [],
    recentAngles: [],
    now: NOW,
    ...overrides,
  };
}

function stateWithWeakTopic(topic: string, errorRate: number) {
  const s = createEmptyState("u1", "d1");
  return {
    ...s,
    grammar: {
      weakTopics: [
        { topic, errorRate, sampleCount: 5, lastCoveredAt: new Date(NOW - 86_400_000).toISOString() },
      ],
    },
  };
}

describe("free starter", () => {
  it("is always available, even with no state at all", () => {
    expect(getStarter("free").isAvailable(ctx())).toBe(true);
  });

  it("builds a prompt that hands the topic to the student", () => {
    const built = getStarter("free").build(ctx());
    expect(built.id).toBe("free");
    expect(built.prompt).toMatch(/THEY choose the topic/i);
  });
});

describe("learn starter", () => {
  it("is always available", () => {
    expect(getStarter("learn").isAvailable(ctx())).toBe(true);
  });

  it("teaches at the level carried by the context", () => {
    expect(getStarter("learn").build(ctx({ level: "A1" })).prompt).toContain("A1");
    expect(getStarter("learn").build(ctx({ level: "C1" })).prompt).toContain("C1");
  });

  it("feeds the model real syllabus topics for that level", () => {
    const prompt = getStarter("learn").build(ctx({ level: "A1" })).prompt;
    expect(prompt).toMatch(/from this student's A1 syllabus/i);
  });

  it("picks a different angle for a different seed", () => {
    const a = getStarter("learn").build(ctx({ seed: 0 })).angle;
    const b = getStarter("learn").build(ctx({ seed: 1 })).angle;
    expect(a).not.toBe(b);
  });

  it("avoids an angle used recently", () => {
    const first = getStarter("learn").build(ctx({ seed: 0 })).angle;
    const second = getStarter("learn").build(ctx({ seed: 0, recentAngles: [first] })).angle;
    expect(second).not.toBe(first);
  });
});

describe("review starter", () => {
  it("is unavailable with no state", () => {
    expect(getStarter("review").isAvailable(ctx())).toBe(false);
  });

  it("is unavailable when every weak topic is below the error threshold", () => {
    const state = stateWithWeakTopic("articles", 0.2);
    expect(getStarter("review").isAvailable(ctx({ state }))).toBe(false);
  });

  it("becomes available once a topic passes the threshold", () => {
    const state = stateWithWeakTopic("past-simple", 0.62);
    expect(getStarter("review").isAvailable(ctx({ state }))).toBe(true);
  });

  it("names the weakest topic in its subtitle and prompt", () => {
    const state = stateWithWeakTopic("past-simple", 0.62);
    const built = getStarter("review").build(ctx({ state }));
    expect(built.prompt).toContain("past-simple");
    expect(built.subtitle).toContain("past-simple");
  });
});

describe("world starter", () => {
  it("is unavailable with neither interests nor a domain profile", () => {
    expect(getStarter("world").isAvailable(ctx())).toBe(false);
  });

  it("is available with declared interests alone", () => {
    expect(getStarter("world").isAvailable(ctx({ interests: ["gaming"] }))).toBe(true);
  });

  it("rotates between declared interests by seed", () => {
    const base = { interests: ["gaming", "food", "travel"] as const };
    const first = getStarter("world").build(ctx({ ...base, seed: 0 })).title;
    const second = getStarter("world").build(ctx({ ...base, seed: 1 })).title;
    expect(first).not.toBe(second);
  });

  it("falls back to the domain profile when no interests are declared", () => {
    const state = {
      ...createEmptyState("u1", "d1"),
      domainProfile: { domains: [{ id: "engineering" as const, label: "ingeniería", wordCount: 1 }], categories: [] },
    } as never;
    expect(getStarter("world").isAvailable(ctx({ state }))).toBe(true);
  });
});

describe("STARTERS registry", () => {
  it("holds exactly the four known starters", () => {
    expect(STARTERS.map((s) => s.id).sort()).toEqual(["free", "learn", "review", "world"]);
  });

  it("gives every starter a non-empty title, subtitle and prompt", () => {
    const state = stateWithWeakTopic("past-simple", 0.7);
    const c = ctx({ state, interests: ["books"] });
    for (const starter of STARTERS) {
      const built = starter.build(c);
      expect(built.title, starter.id).toBeTruthy();
      expect(built.subtitle, starter.id).toBeTruthy();
      expect(built.prompt, starter.id).toBeTruthy();
    }
  });
});
