import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  upsert: vi.fn(),
  tryGetSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    from: (table: string) => table === "assessment_results"
      ? { insert: mocks.insert }
      : { upsert: mocks.upsert },
  }),
}));

vi.mock("@/lib/supabase/service-role", () => ({
  tryGetSupabaseAdminClient: mocks.tryGetSupabaseAdminClient,
}));

import { persistAssessmentOutcome, saveAssessmentResult } from "../assessment-queries";
import type { AssessmentResult } from "../assessment";

const result: AssessmentResult = {
  assignedLevel: "B1",
  passed: true,
  passedLevels: ["a1", "a2"],
  score: 8,
  total: 10,
  listeningScore: 0,
  listeningTotal: 0,
  topicScores: [{ lessonSlug: "intro", title: "Intro", correct: 1, total: 2 }],
  strengths: [],
  needsReview: [{ lessonSlug: "intro", title: "Intro" }],
  conceptSignals: [{
    lessonSlug: "intro",
    level: "b1",
    title: "Intro",
    selfRating: "familiar",
    status: "review",
    correct: 1,
    total: 2,
    assessedAt: "2026-07-18T12:00:00.000Z",
  }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.insert.mockResolvedValue({ error: null });
  mocks.upsert.mockResolvedValue({ error: null });
  mocks.tryGetSupabaseAdminClient.mockReturnValue({
    from: (table: string) => {
      expect(table).toBe("user_profiles");
      return { upsert: mocks.upsert };
    },
  });
});

describe("assessment persistence", () => {
  it("stores a versioned topic and concept payload", async () => {
    await saveAssessmentResult("u1", "placement", result, "b1");

    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      topic_scores: {
        version: 3,
        listeningScore: result.listeningScore,
        listeningTotal: result.listeningTotal,
        topics: result.topicScores,
        concepts: result.conceptSignals,
      },
    }));
  });

  it("updates user_profiles exclusively using admin client", async () => {
    await persistAssessmentOutcome("u1", "placement", result, "b1");

    expect(mocks.tryGetSupabaseAdminClient).toHaveBeenCalled();
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "u1",
        cefr_level: "B1",
        cefr_level_source: "placement",
      }),
      { onConflict: "id" },
    );
  });

  it("does not update user_profiles when mode is checkpoint and result is not passed", async () => {
    const failedResult: AssessmentResult = {
      ...result,
      passed: false,
    };

    await persistAssessmentOutcome("u1", "checkpoint", failedResult, "b1");

    expect(mocks.insert).toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("throws when admin client is unavailable", async () => {
    mocks.tryGetSupabaseAdminClient.mockReturnValueOnce(null);

    await expect(persistAssessmentOutcome("u1", "placement", result)).rejects.toThrow(
      "Supabase admin client unavailable for updating user profile",
    );
  });

  it("throws when the profile upsert fails", async () => {
    const failure = { code: "42501", message: "permission denied" };
    mocks.upsert.mockResolvedValueOnce({ error: failure });

    await expect(persistAssessmentOutcome("u1", "placement", result)).rejects.toEqual(failure);
  });

  it("throws non-missing-table assessment insert errors", async () => {
    const failure = { code: "42501", message: "permission denied" };
    mocks.insert.mockResolvedValueOnce({ error: failure });

    await expect(saveAssessmentResult("u1", "placement", result)).rejects.toEqual(failure);
  });
});
