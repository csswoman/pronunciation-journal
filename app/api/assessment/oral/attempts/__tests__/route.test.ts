import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  validateBody: vi.fn(),
  getAssessmentProfileLevel: vi.fn(),
  persistAssessmentOutcome: vi.fn(),
  createAssessmentOralAttempt: vi.fn(),
  findPendingAssessmentOralAttempt: vi.fn(),
  getAssessmentOralAttempt: vi.fn(),
  issueAssessmentOralChallenge: vi.fn(),
  pruneExpiredAssessmentOralAttempts: vi.fn(),
}));

vi.mock("@/lib/api/guards", () => ({
  requireSameOrigin: () => null,
  requireUser: async () => ({ user: { id: "u1" }, error: null }),
  rateLimit: async () => ({ limited: false, error: null }),
  validateBody: mocks.validateBody,
  SECURE_HEADERS: { "Cache-Control": "no-store" },
  publicErrorResponse: (status: number, message: string) => Response.json({ error: message }, { status }),
}));

vi.mock("@/lib/courses/assessment-queries", () => ({
  getAssessmentProfileLevel: mocks.getAssessmentProfileLevel,
  persistAssessmentOutcome: mocks.persistAssessmentOutcome,
}));

vi.mock("@/lib/courses/assessment-oral-queries", () => ({
  createAssessmentOralAttempt: mocks.createAssessmentOralAttempt,
  findPendingAssessmentOralAttempt: mocks.findPendingAssessmentOralAttempt,
  getAssessmentOralAttempt: mocks.getAssessmentOralAttempt,
  issueAssessmentOralChallenge: mocks.issueAssessmentOralChallenge,
  pruneExpiredAssessmentOralAttempts: mocks.pruneExpiredAssessmentOralAttempts,
}));

vi.mock("@/lib/api/logging", () => ({ logServerError: vi.fn() }));

import { POST } from "../route";
import { buildServerAssessment } from "@/lib/courses/server-assessment";

const attemptId = "df7539d3-0346-4432-8e93-884eaf79da44";

function reqWith(body: unknown): Request {
  return new Request("http://x/api/assessment/oral/attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function passingAnswers(): Record<string, number> {
  const { questions } = buildServerAssessment("checkpoint", "a1");
  return Object.fromEntries(questions.map((question) => [question.id, question.answer]));
}

function storedAttempt() {
  return {
    id: attemptId,
    user_id: "u1",
    level: "a1",
    answers: passingAnswers(),
    self_ratings: {},
    status: "oral_pending",
    challenge_id: null,
    item_id: null,
    used_item_ids: [],
    challenge_expires_at: null,
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    oral_audio_sha256: null,
    rubric_version: null,
    created_at: new Date().toISOString(),
    completed_at: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.validateBody.mockImplementation(async (request: Request, schema: z.ZodType) => {
    const parsed = schema.safeParse(await request.json());
    return parsed.success
      ? { data: parsed.data, error: null }
      : { data: null, error: Response.json({ error: "Invalid request body" }, { status: 400 }) };
  });
  mocks.getAssessmentProfileLevel.mockResolvedValue("A1");
  mocks.persistAssessmentOutcome.mockResolvedValue(undefined);
  mocks.findPendingAssessmentOralAttempt.mockResolvedValue(null);
  mocks.getAssessmentOralAttempt.mockResolvedValue(null);
  mocks.pruneExpiredAssessmentOralAttempts.mockResolvedValue(undefined);
  mocks.createAssessmentOralAttempt.mockImplementation(async (input: { id: string }) => ({
    ...storedAttempt(),
    id: input.id,
  }));
  mocks.issueAssessmentOralChallenge.mockImplementation(async (input: {
    challengeId: string;
    challengeExpiresAt: string;
    itemId: string;
  }) => ({
    ...storedAttempt(),
    challenge_id: input.challengeId,
    challenge_expires_at: input.challengeExpiresAt,
    item_id: input.itemId,
    used_item_ids: [input.itemId],
  }));
});

describe("oral assessment attempts route", () => {
  it("rejects client-supplied pass claims and altered question IDs", async () => {
    const tamperedAnswers = passingAnswers();
    const firstQuestionId = Object.keys(tamperedAnswers)[0];
    delete tamperedAnswers[firstQuestionId];
    tamperedAnswers["invented-question"] = 1;

    const altered = await POST(reqWith({ level: "a1", answers: tamperedAnswers }) as never);
    const passClaim = await POST(reqWith({ level: "a1", answers: passingAnswers(), passed: true }) as never);

    expect(altered.status).toBe(400);
    expect(passClaim.status).toBe(400);
    expect(mocks.createAssessmentOralAttempt).not.toHaveBeenCalled();
  });

  it("does not expose an attempt belonging to another user", async () => {
    const response = await POST(reqWith({ level: "a1", assessmentAttemptId: attemptId }) as never);

    expect(response.status).toBe(404);
    expect(mocks.getAssessmentOralAttempt).toHaveBeenCalledWith("u1", attemptId);
    expect(mocks.issueAssessmentOralChallenge).not.toHaveBeenCalled();
  });

  it("creates a challenge from server-owned answers and a server-owned task", async () => {
    const response = await POST(reqWith({ level: "a1", answers: passingAnswers() }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      attemptId: expect.any(String),
      challenge: {
        level: "a1",
        prompt: expect.stringContaining("fictional person"),
        id: expect.any(String),
      },
    });
    expect(mocks.createAssessmentOralAttempt).toHaveBeenCalledWith(expect.objectContaining({
      userId: "u1",
      level: "a1",
      answers: passingAnswers(),
    }));
  });

  it("does not replace the saved answer set when resuming an attempt", async () => {
    const response = await POST(reqWith({
      level: "a1",
      assessmentAttemptId: attemptId,
      answers: passingAnswers(),
    }) as never);

    expect(response.status).toBe(400);
    expect(mocks.getAssessmentOralAttempt).not.toHaveBeenCalled();
  });

  it("resumes a saved attempt with a new server-issued challenge", async () => {
    mocks.getAssessmentOralAttempt.mockResolvedValueOnce(storedAttempt());

    const response = await POST(reqWith({ level: "a1", assessmentAttemptId: attemptId }) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.attemptId).toBe(attemptId);
    expect(body.challenge.prompt).toContain("fictional person");
    expect(mocks.createAssessmentOralAttempt).not.toHaveBeenCalled();
    expect(mocks.issueAssessmentOralChallenge).toHaveBeenCalledWith(expect.objectContaining({
      userId: "u1",
      attemptId,
    }));
  });
});
