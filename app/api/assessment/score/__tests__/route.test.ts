import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  validateBody: vi.fn(),
  rateLimit: vi.fn(),
  requireSameOrigin: vi.fn(),
}));

vi.mock("@/lib/api/guards", () => ({
  requireSameOrigin: mocks.requireSameOrigin,
  rateLimit: mocks.rateLimit,
  validateBody: mocks.validateBody,
  getClientIp: () => "203.0.113.10",
  hashIp: () => "hashed-client-ip",
  SECURE_HEADERS: { "Cache-Control": "no-store" },
  publicErrorResponse: (status: number, message: string) => Response.json({ error: message }, { status }),
}));

import { POST } from "../route";
import { buildServerAssessment } from "@/lib/courses/server-assessment";

function reqWith(body: unknown): Request {
  return new Request("http://x/api/assessment/score", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mocks.validateBody.mockReset();
  mocks.rateLimit.mockReset().mockResolvedValue({ limited: false, error: null });
  mocks.requireSameOrigin.mockReset().mockReturnValue(null);
});

describe("assessment score route", () => {
  it("rescores listening on the server and rejects a written-only pass", async () => {
    const { questions } = buildServerAssessment("checkpoint", "a1");
    const answers = Object.fromEntries(questions
      .filter((question) => question.type !== "listening")
      .map((question) => [question.id, question.answer]));
    questions.filter((question) => question.type === "listening").slice(0, 2)
      .forEach((question) => { answers[question.id] = question.answer; });
    mocks.validateBody.mockResolvedValueOnce({
      data: { mode: "checkpoint", checkpointLevel: "a1", answers },
      error: null,
    });

    const response = await POST(reqWith({}) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.result).toMatchObject({
      score: 10,
      total: 14,
      listeningScore: 2,
      listeningTotal: 6,
      passed: false,
      assignedLevel: "A1",
    });
    expect(mocks.rateLimit).toHaveBeenCalledWith(
      "/api/assessment/score:hashed-client-ip",
      expect.objectContaining({ max: 30 }),
    );
  });

  it("accepts a checkpoint only when its listening minimum is met", async () => {
    const { questions } = buildServerAssessment("checkpoint", "a1");
    mocks.validateBody.mockResolvedValueOnce({
      data: {
        mode: "checkpoint",
        checkpointLevel: "a1",
        answers: Object.fromEntries(questions.map((question) => [question.id, question.answer])),
      },
      error: null,
    });

    const response = await POST(reqWith({}) as never);
    const body = await response.json();
    expect(body.result).toMatchObject({ passed: true, listeningScore: 6, assignedLevel: "A2" });
  });

  it("returns same-origin and rate-limit errors before scoring", async () => {
    mocks.requireSameOrigin.mockReturnValueOnce(Response.json({ error: "blocked" }, { status: 403 }));
    const blocked = await POST(reqWith({}) as never);
    expect(blocked.status).toBe(403);
    expect(mocks.rateLimit).not.toHaveBeenCalled();

    mocks.requireSameOrigin.mockReturnValueOnce(null);
    mocks.rateLimit.mockResolvedValueOnce({ limited: true, error: Response.json({ error: "limited" }, { status: 429 }) });
    const limited = await POST(reqWith({}) as never);
    expect(limited.status).toBe(429);
    expect(mocks.validateBody).not.toHaveBeenCalled();
  });
});
