import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/ai-practice/server-state", () => ({
  fetchServerLearningState: vi.fn(async () => null),
}));

vi.mock("@/lib/api/guards", () => ({
  requireSameOrigin: () => null,
  requireUser: async () => ({ user: { id: "u1" }, error: null, accessToken: null }),
  rateLimit: () => ({ limited: false, error: null }),
  validateBody: vi.fn(),
  SECURE_HEADERS: { "Cache-Control": "no-store" },
  publicErrorResponse: (status: number, message: string) => Response.json({ error: message }, { status }),
}));

import { GeminiRequestSchema } from "../route";

function baseRequest(voice?: unknown, missionId?: string) {
  return {
    messages: [
      { role: "user", content: "hello", ...(voice !== undefined ? { voice } : {}) },
    ],
    ...(missionId !== undefined ? { missionId } : {}),
  };
}

describe("GeminiRequestSchema — voice field", () => {
  it("accepts a message with no voice field", () => {
    const result = GeminiRequestSchema.safeParse(baseRequest());
    expect(result.success).toBe(true);
  });

  it("accepts a valid scored voice object", () => {
    const result = GeminiRequestSchema.safeParse(baseRequest({ transcript: true, scored: true }));
    expect(result.success).toBe(true);
  });

  it("accepts a valid unscored voice object", () => {
    const result = GeminiRequestSchema.safeParse(baseRequest({ transcript: true, scored: false }));
    expect(result.success).toBe(true);
  });

  it("rejects a voice object with an extra unknown key", () => {
    const result = GeminiRequestSchema.safeParse(
      baseRequest({ transcript: true, scored: true, extra: "nope" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects a voice object with transcript: false", () => {
    const result = GeminiRequestSchema.safeParse(baseRequest({ transcript: false, scored: true }));
    expect(result.success).toBe(false);
  });

  it("rejects a voice object with a non-boolean scored", () => {
    const result = GeminiRequestSchema.safeParse(baseRequest({ transcript: true, scored: "yes" }));
    expect(result.success).toBe(false);
  });

  it("rejects a voice object missing scored", () => {
    const result = GeminiRequestSchema.safeParse(baseRequest({ transcript: true }));
    expect(result.success).toBe(false);
  });
});

describe("GeminiRequestSchema — mission field", () => {
  it("accepts a bounded mission id alongside the conversation", () => {
    expect(GeminiRequestSchema.safeParse(baseRequest(undefined, "roleplay.cafe")).success).toBe(true);
  });

  it("rejects an empty mission id", () => {
    expect(GeminiRequestSchema.safeParse(baseRequest(undefined, "")).success).toBe(false);
  });
});
