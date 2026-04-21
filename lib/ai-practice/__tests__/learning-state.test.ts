import { describe, it, expect, beforeEach } from "vitest";
import {
  compactState,
  applyExerciseResult,
  createEmptyState,
  type UserLearningState,
} from "../learning-state";
import type { ExerciseResult } from "../types";

function makeState(overrides: Partial<UserLearningState> = {}): UserLearningState {
  return {
    ...createEmptyState("user-1", "device-1"),
    ...overrides,
  };
}

// ─── compactState ────────────────────────────────────────────────────────────

describe("compactState", () => {
  it("includes CEFR level and confidence", () => {
    const s = makeState({ level: { cefrEstimate: "B2", confidence: 0.8 } });
    const out = compactState(s);
    expect(out).toMatch(/Student: B2, conf 0\.8/);
  });

  it("omits Weak grammar line when no weak topics", () => {
    const out = compactState(makeState());
    expect(out).not.toMatch(/Weak grammar/);
  });

  it("omits Weak sounds line when no struggling sounds", () => {
    const out = compactState(makeState());
    expect(out).not.toMatch(/Weak sounds/);
  });

  it("shows top-2 grammar topics sorted by priority (errorRate × age)", () => {
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago
    const recent = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();   // 1 hour ago

    const s = makeState({
      grammar: {
        weakTopics: [
          { topic: "articles", errorRate: 0.5, sampleCount: 5, lastCoveredAt: old },
          { topic: "past_simple", errorRate: 0.4, sampleCount: 3, lastCoveredAt: recent },
          { topic: "conditionals", errorRate: 0.8, sampleCount: 2, lastCoveredAt: old },
        ],
      },
    });

    const out = compactState(s);
    // "articles" and "conditionals" have old lastCoveredAt → higher priority
    expect(out).toMatch(/Weak grammar:/);
    expect(out).toContain("conditionals(80%)");
    // past_simple is recent → lower priority, should NOT be in top 2
    expect(out).not.toContain("past_simple");
  });

  it("shows top-2 struggling sounds", () => {
    const s = makeState({
      pronunciation: {
        averageAccuracy: 60,
        strugglingSounds: [
          { ipa: "/θ/", avgAccuracy: 40, attempts: 5 },
          { ipa: "/ð/", avgAccuracy: 45, attempts: 3 },
          { ipa: "/æ/", avgAccuracy: 50, attempts: 4 },
        ],
      },
    });

    const out = compactState(s);
    expect(out).toContain("/θ/");
    expect(out).toContain("/ð/");
    expect(out).not.toContain("/æ/");
  });

  it("shows 'none' when no recent sessions", () => {
    const out = compactState(makeState());
    expect(out).toMatch(/Recently covered: none/);
  });

  it("lists up to 2 recent session topics", () => {
    const s = makeState({
      lastSessions: [
        { topic: "articles", endedAt: new Date().toISOString(), exercisesCompleted: 3, correctRate: 0.7 },
        { topic: "past_simple", endedAt: new Date().toISOString(), exercisesCompleted: 2, correctRate: 0.5 },
        { topic: "conditionals", endedAt: new Date().toISOString(), exercisesCompleted: 4, correctRate: 0.8 },
      ],
    });

    const out = compactState(s);
    expect(out).toContain("articles");
    expect(out).toContain("past_simple");
    expect(out).not.toContain("conditionals");
  });
});

// ─── applyExerciseResult ─────────────────────────────────────────────────────

describe("applyExerciseResult", () => {
  const baseResult: ExerciseResult = {
    correct: true,
    topic: "articles",
    gradedBy: "client",
  };

  it("adds new topic when not in weakTopics", () => {
    const state = makeState();
    const next = applyExerciseResult(state, { ...baseResult, correct: false });
    const topic = next.grammar.weakTopics.find(t => t.topic === "articles");
    expect(topic).toBeDefined();
    expect(topic!.errorRate).toBe(1);
    expect(topic!.sampleCount).toBe(1);
  });

  it("correct answer on new topic → errorRate 0", () => {
    const state = makeState();
    const next = applyExerciseResult(state, baseResult);
    const topic = next.grammar.weakTopics.find(t => t.topic === "articles");
    expect(topic!.errorRate).toBe(0);
  });

  it("applies EMA correctly on existing topic (incorrect answer)", () => {
    const state = makeState({
      grammar: {
        weakTopics: [{ topic: "articles", errorRate: 0.5, sampleCount: 4, lastCoveredAt: new Date().toISOString() }],
      },
    });
    const next = applyExerciseResult(state, { ...baseResult, correct: false });
    const topic = next.grammar.weakTopics.find(t => t.topic === "articles")!;
    // EMA: 0.5 * 0.7 + 1 * 0.3 = 0.65
    expect(topic.errorRate).toBeCloseTo(0.65, 5);
    expect(topic.sampleCount).toBe(5);
  });

  it("applies EMA correctly on existing topic (correct answer)", () => {
    const state = makeState({
      grammar: {
        weakTopics: [{ topic: "articles", errorRate: 0.5, sampleCount: 4, lastCoveredAt: new Date().toISOString() }],
      },
    });
    const next = applyExerciseResult(state, baseResult);
    const topic = next.grammar.weakTopics.find(t => t.topic === "articles")!;
    // EMA: 0.5 * 0.7 + 0 * 0.3 = 0.35
    expect(topic.errorRate).toBeCloseTo(0.35, 5);
  });

  it("updates lastCoveredAt on exercise", () => {
    const before = new Date(Date.now() - 60_000).toISOString();
    const state = makeState({
      grammar: {
        weakTopics: [{ topic: "articles", errorRate: 0.5, sampleCount: 2, lastCoveredAt: before }],
      },
    });
    const next = applyExerciseResult(state, baseResult);
    const topic = next.grammar.weakTopics.find(t => t.topic === "articles")!;
    expect(topic.lastCoveredAt > before).toBe(true);
  });

  it("does not mutate original state (immutability)", () => {
    const state = makeState();
    const next = applyExerciseResult(state, { ...baseResult, correct: false });
    expect(state.grammar.weakTopics).toHaveLength(0);
    expect(next.grammar.weakTopics).toHaveLength(1);
  });

  describe("level.confidence", () => {
    it("increases by 0.02 on correct answer", () => {
      const state = makeState({ level: { cefrEstimate: "B1", confidence: 0.5 } });
      const next = applyExerciseResult(state, baseResult);
      expect(next.level.confidence).toBeCloseTo(0.52, 5);
    });

    it("decreases by 0.03 on incorrect answer", () => {
      const state = makeState({ level: { cefrEstimate: "B1", confidence: 0.5 } });
      const next = applyExerciseResult(state, { ...baseResult, correct: false });
      expect(next.level.confidence).toBeCloseTo(0.47, 5);
    });

    it("clamps confidence to [0, 1]", () => {
      const atMax = makeState({ level: { cefrEstimate: "B1", confidence: 1.0 } });
      expect(applyExerciseResult(atMax, baseResult).level.confidence).toBe(1);

      const atMin = makeState({ level: { cefrEstimate: "B1", confidence: 0.0 } });
      expect(applyExerciseResult(atMin, { ...baseResult, correct: false }).level.confidence).toBe(0);
    });
  });

  describe("pronunciation update", () => {
    it("updates averageAccuracy when gradedBy model with score", () => {
      const state = makeState({ pronunciation: { averageAccuracy: 60, strugglingSounds: [] } });
      const result: ExerciseResult = { correct: true, topic: "speaking", gradedBy: "model", score: 0.9 };
      const next = applyExerciseResult(state, result);
      // EMA: 60 * 0.7 + 90 * 0.3 = 42 + 27 = 69
      expect(next.pronunciation.averageAccuracy).toBeCloseTo(69, 5);
    });

    it("does not update averageAccuracy when gradedBy client", () => {
      const state = makeState({ pronunciation: { averageAccuracy: 60, strugglingSounds: [] } });
      const next = applyExerciseResult(state, { ...baseResult, gradedBy: "client" });
      expect(next.pronunciation.averageAccuracy).toBe(60);
    });

    it("does not update averageAccuracy when score is undefined", () => {
      const state = makeState({ pronunciation: { averageAccuracy: 60, strugglingSounds: [] } });
      const result: ExerciseResult = { correct: true, topic: "speaking", gradedBy: "model" };
      const next = applyExerciseResult(state, result);
      expect(next.pronunciation.averageAccuracy).toBe(60);
    });
  });
});
