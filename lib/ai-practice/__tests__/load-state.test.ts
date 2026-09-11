// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserLearningState } from "../learning-state";

const mocks = vi.hoisted(() => ({
  learningStateGet: vi.fn(),
  srsRatingEvents: vi.fn(),
  getUserStats: vi.fn(),
  getFavorites: vi.fn(),
  getNeedsPracticeWords: vi.fn(),
  getWordBankSourceRefs: vi.fn(),
  getWordCategoryIndex: vi.fn(),
  deriveDomainProfile: vi.fn(),
  emptyDomainProfile: vi.fn(),
  supabaseFrom: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    learningState: { get: mocks.learningStateGet },
    srsRatingEvents: {
      where: () => ({ between: () => ({ toArray: mocks.srsRatingEvents }) }),
    },
  },
  getUserStats: mocks.getUserStats,
  getFavorites: mocks.getFavorites,
  getNeedsPracticeWords: mocks.getNeedsPracticeWords,
}));
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ from: mocks.supabaseFrom }),
}));
vi.mock("@/lib/word-bank/domain-queries", () => ({
  getWordBankSourceRefs: mocks.getWordBankSourceRefs,
}));
vi.mock("@/lib/lexicon/word-index-client", () => ({
  getWordCategoryIndex: mocks.getWordCategoryIndex,
}));
vi.mock("@/lib/lexicon/domain-profile", () => ({
  deriveDomainProfile: mocks.deriveDomainProfile,
  emptyDomainProfile: mocks.emptyDomainProfile,
}));

import { getUserLearningState, __clearLearningStateCache } from "../load-state";

/** The persisted fields the coach depends on but cannot recompute from stats. */
function storedState(): UserLearningState {
  return {
    userId: "user-a",
    updatedAt: "2026-09-01T00:00:00.000Z",
    deviceId: "device-1",
    level: { cefrEstimate: "B1", confidence: 0.9 },
    vocabulary: { knownCount: 0, strugglingWords: [], savedWords: [] },
    grammar: {
      weakTopics: [
        {
          topic: "present perfect",
          errorRate: 0.7,
          sampleCount: 10,
          lastCoveredAt: "2026-09-01T00:00:00.000Z",
        },
      ],
    },
    theory: {
      concepts: [
        {
          lessonSlug: "conditionals",
          level: "b1",
          title: "Conditionals",
          selfRating: "unknown",
          status: "review",
          correct: 0,
          total: 2,
          assessedAt: "2026-09-01T00:00:00.000Z",
          source: "manual",
        },
      ],
    },
    pronunciation: { averageAccuracy: 0, strugglingSounds: [] },
    lastSessions: [
      {
        topic: "Present perfect",
        endedAt: "2026-09-01T00:00:00.000Z",
        exercisesCompleted: 4,
        correctRate: 0.5,
      },
    ],
    errorRecurrence: { patterns: [] } as unknown as UserLearningState["errorRecurrence"],
    domainProfile: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  __clearLearningStateCache();

  mocks.learningStateGet.mockResolvedValue(undefined);
  mocks.srsRatingEvents.mockResolvedValue([]);
  mocks.getUserStats.mockResolvedValue({
    averageAccuracy: 55,
    totalAttempts: 40,
    totalWords: 12,
  });
  mocks.getFavorites.mockResolvedValue([]);
  mocks.getNeedsPracticeWords.mockResolvedValue([]);
  mocks.getWordBankSourceRefs.mockResolvedValue([]);
  mocks.getWordCategoryIndex.mockResolvedValue({});
  mocks.deriveDomainProfile.mockReturnValue({ domains: [] });
  mocks.emptyDomainProfile.mockReturnValue({ domains: [] });
  mocks.supabaseFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        gt: () => ({
          order: () => ({ limit: () => Promise.resolve({ data: [] }) }),
        }),
      }),
    }),
  });
});

describe("getUserLearningState", () => {
  it("keeps grammar weak topics from the persisted row", async () => {
    mocks.learningStateGet.mockResolvedValue({
      userId: "user-a",
      state: storedState(),
      updatedAt: "2026-09-01T00:00:00.000Z",
    });

    const state = await getUserLearningState("user-a");

    expect(state.grammar.weakTopics).toHaveLength(1);
    expect(state.grammar.weakTopics[0].topic).toBe("present perfect");
  });

  it("keeps lastSessions so the coach can avoid repeating topics", async () => {
    mocks.learningStateGet.mockResolvedValue({
      userId: "user-a",
      state: storedState(),
      updatedAt: "2026-09-01T00:00:00.000Z",
    });

    const state = await getUserLearningState("user-a");

    expect(state.lastSessions.map((s) => s.topic)).toEqual(["Present perfect"]);
  });

  it("keeps theory concepts and focus from the persisted row", async () => {
    const stored = storedState();
    stored.focus = { thread: { kind: "theory", topicId: "conditionals" } } as UserLearningState["focus"];
    mocks.learningStateGet.mockResolvedValue({
      userId: "user-a",
      state: stored,
      updatedAt: "2026-09-01T00:00:00.000Z",
    });

    const state = await getUserLearningState("user-a");

    expect(state.theory.concepts).toHaveLength(1);
    expect(state.focus).toEqual({ thread: { kind: "theory", topicId: "conditionals" } });
  });

  it("still recomputes live signals from stats, not from the stale row", async () => {
    mocks.learningStateGet.mockResolvedValue({
      userId: "user-a",
      state: storedState(),
      updatedAt: "2026-09-01T00:00:00.000Z",
    });
    mocks.getFavorites.mockResolvedValue([{ word: "though", ipa: "ðoʊ" }]);

    const state = await getUserLearningState("user-a");

    // Recomputed: accuracy 55 -> B1, favourites feed savedWords.
    expect(state.vocabulary.savedWords).toEqual([{ word: "though", ipa: "ðoʊ" }]);
    expect(state.vocabulary.knownCount).toBe(12);
  });

  it("surfaces topics failed in practice, which the coach never ran itself", async () => {
    const occurredAt = new Date().toISOString();
    mocks.srsRatingEvents.mockResolvedValue(
      [1, 1, 4].map((grade, i) => ({
        id: `e${i}`,
        userId: "user-a",
        entityType: "topic_srs",
        topic: "grammar:passive",
        grade,
        occurredAt,
        status: "applied",
        createdAt: occurredAt,
      })),
    );

    const state = await getUserLearningState("user-a");

    expect(state.grammar.weakTopics.map((t) => t.topic)).toContain("Voz pasiva");
  });

  it("does not let practice data overwrite a topic the coach already tracks", async () => {
    const stored = storedState();
    stored.grammar.weakTopics = [
      {
        topic: "Voz pasiva",
        errorRate: 0.5,
        sampleCount: 20,
        lastCoveredAt: "2026-09-01T00:00:00.000Z",
      },
    ];
    mocks.learningStateGet.mockResolvedValue({
      userId: "user-a",
      state: stored,
      updatedAt: "2026-09-01T00:00:00.000Z",
    });

    const occurredAt = new Date().toISOString();
    mocks.srsRatingEvents.mockResolvedValue(
      [1, 1, 1].map((grade, i) => ({
        id: `e${i}`,
        userId: "user-a",
        entityType: "topic_srs",
        topic: "grammar:passive",
        grade,
        occurredAt,
        status: "applied",
        createdAt: occurredAt,
      })),
    );

    const state = await getUserLearningState("user-a");

    const passive = state.grammar.weakTopics.filter((t) => t.topic === "Voz pasiva");
    expect(passive).toHaveLength(1);
    expect(passive[0].sampleCount).toBe(20);
  });

  it("degrades to the stored weak topics when the SRS read fails", async () => {
    mocks.learningStateGet.mockResolvedValue({
      userId: "user-a",
      state: storedState(),
      updatedAt: "2026-09-01T00:00:00.000Z",
    });
    mocks.srsRatingEvents.mockRejectedValue(new Error("dexie closed"));

    const state = await getUserLearningState("user-a");

    expect(state.grammar.weakTopics.map((t) => t.topic)).toEqual(["present perfect"]);
  });

  it("works with no persisted row at all", async () => {
    mocks.learningStateGet.mockResolvedValue(undefined);

    const state = await getUserLearningState("user-a");

    expect(state.grammar.weakTopics).toEqual([]);
    expect(state.lastSessions).toEqual([]);
    expect(state.vocabulary.knownCount).toBe(12);
  });
});
