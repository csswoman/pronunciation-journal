import { describe, it, expect } from "vitest";
import { buildPronunciationStarterPrompt, buildWorldStarterPrompt } from "@/lib/ai-prompts";
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

  it("still forbids exercise tools on the first turn but allows annotate_turn", () => {
    const prompt = getStarter("learn").build(ctx()).prompt;
    expect(prompt).toContain("Do NOT call any exercise tool on this first turn");
    expect(prompt).not.toMatch(/Do NOT call any tool on this first turn/i);
  });

  it("tells the coach to emit a concept so the lesson can be saved", () => {
    const prompt = getStarter("learn").build(ctx()).prompt;
    expect(prompt).toMatch(/call annotate_turn with a concept/i);
  });

  it("tells the coach to end with a topical suggestions: block", () => {
    const prompt = getStarter("learn").build(ctx()).prompt;
    expect(prompt).toMatch(/end your message with a suggestions: block/i);
    expect(prompt).toContain("exactly 3 short first-person replies");
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

describe("pronunciation starter prompt", () => {
  it("no longer forbids all tools on the first turn", () => {
    const prompt = buildPronunciationStarterPrompt({ level: "A2" });
    expect(prompt).not.toMatch(/Do NOT call any tool on this first turn/i);
    expect(prompt).toContain("Do NOT call any exercise tool on this first turn");
  });

  it("tells the coach to emit a concept for the sound it taught", () => {
    const prompt = buildPronunciationStarterPrompt({ level: "A2" });
    expect(prompt).toMatch(/call annotate_turn with a concept/i);
  });

  it("tells the coach to end with a topical suggestions: block", () => {
    const prompt = buildPronunciationStarterPrompt({ level: "A2" });
    expect(prompt).toMatch(/end your message with a suggestions: block/i);
  });
});

describe("world starter prompt", () => {
  const base = { interest: "gaming", knownWords: [], angle: "a real situation they would face" } as const;

  it("no longer forbids all tools on the first turn", () => {
    const prompt = buildWorldStarterPrompt({ ...base });
    expect(prompt).not.toMatch(/do NOT call any\s+tool on this first turn/i);
    expect(prompt).toContain("Do NOT call any exercise tool on this first turn");
  });

  it("tells the coach to emit a concept so the point can be saved", () => {
    const prompt = buildWorldStarterPrompt({ ...base });
    expect(prompt).toMatch(/call annotate_turn with a concept/i);
  });

  it("tells the coach to end with a topical suggestions: block", () => {
    const prompt = buildWorldStarterPrompt({ ...base });
    expect(prompt).toMatch(/end your message with a suggestions: block/i);
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
