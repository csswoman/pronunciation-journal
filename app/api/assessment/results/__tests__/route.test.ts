import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  validateBody: vi.fn(),
  persistAssessmentOutcome: vi.fn(),
  tryGetSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/api/guards", () => ({
  requireSameOrigin: () => null,
  requireUser: async () => ({ user: { id: "u1" }, error: null }),
  rateLimit: () => ({ limited: false, error: null }),
  validateBody: mocks.validateBody,
  SECURE_HEADERS: { "Cache-Control": "no-store" },
  publicErrorResponse: (status: number, message: string) =>
    Response.json({ error: message }, { status }),
}));

vi.mock("@/lib/courses/assessment-queries", () => ({
  persistAssessmentOutcome: mocks.persistAssessmentOutcome,
}));

vi.mock("@/lib/supabase/service-role", () => ({
  tryGetSupabaseAdminClient: mocks.tryGetSupabaseAdminClient,
}));

import { POST } from "../route";
import { AssessmentResultSchema } from "@/lib/courses/assessment-schema";

function reqWith(body: unknown): Request {
  return new Request("http://x/api/assessment/results", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mocks.validateBody.mockReset();
  mocks.persistAssessmentOutcome.mockReset();
  mocks.tryGetSupabaseAdminClient.mockReset();
});

describe("assessment results route", () => {
  it("returns the validation response when the body is invalid", async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: null,
      error: Response.json({ error: "Invalid request body" }, { status: 400 }),
    });

    const res = await POST(reqWith({}) as never);

    expect(res.status).toBe(400);
    expect(mocks.persistAssessmentOutcome).not.toHaveBeenCalled();
  });

  it("returns 400 answers required when answers field is missing", async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: { mode: "placement", evaluatedLevel: "b1" },
      error: null,
    });

    const res = await POST(reqWith({}) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("answers required");
  });

  it("rejects checkpoint requests where target level exceeds progression limit", async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: { mode: "checkpoint", checkpointLevel: "c1", answers: { "c1:reading:1": 0 } },
      error: null,
    });

    // Mock user profile returning A1 level
    mocks.tryGetSupabaseAdminClient.mockReturnValueOnce({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { cefr_level: "A1" } }),
          }),
        }),
      }),
    });

    const res = await POST(reqWith({}) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Checkpoint level exceeds allowed progression limit");
  });

  it("rescores on server and persists assessment outcome", async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: {
        mode: "placement",
        evaluatedLevels: ["a1"],
        evaluatedLevel: "a1",
        answers: { "a1:reading:1": 0, "a1:reading:2": 1 },
      },
      error: null,
    });
    mocks.persistAssessmentOutcome.mockResolvedValueOnce(undefined);

    const res = await POST(reqWith({}) as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      result: { total: 14, listeningScore: 0, listeningTotal: 6, passed: false },
    });
    expect(mocks.persistAssessmentOutcome).toHaveBeenCalledWith(
      "u1",
      "placement",
      expect.objectContaining({ assignedLevel: expect.any(String) }),
      "a1",
    );
  });

  it("strictly validates bounded concept signals", () => {
    const body = {
      mode: "placement",
      result: {
        assignedLevel: "B1",
        passed: true,
        passedLevels: ["a1"],
        evaluatedLevels: ["a1"],
        score: 1,
        total: 1,
        listeningScore: 0,
        listeningTotal: 0,
        topicScores: [],
        strengths: [],
        needsReview: [],
        conceptSignals: [{
          lessonSlug: "intro",
          level: "b1",
          title: "Intro",
          selfRating: "familiar",
          status: "review",
          correct: 2,
          total: 1,
          assessedAt: "2026-07-18T12:00:00.000Z",
        }],
      },
    };

    expect(AssessmentResultSchema.safeParse(body).success).toBe(false);
    expect(AssessmentResultSchema.safeParse({
      ...body,
      result: {
        ...body.result,
        conceptSignals: Array.from({ length: 101 }, () => ({
          ...body.result.conceptSignals[0],
          correct: 1,
        })),
      },
    }).success).toBe(false);
  });

  it("accepts null checkpointLevel for placement payloads", () => {
    expect(AssessmentResultSchema.safeParse({
      mode: "placement",
      evaluatedLevels: ["a1"],
      answers: { "a1:reading:1": 0 },
      checkpointLevel: null,
    }).success).toBe(true);
  });
});
