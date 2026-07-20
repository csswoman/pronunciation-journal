import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateContent: vi.fn(),
  requireUser: vi.fn(),
  validateBody: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mocks.generateContent };
  },
}));

vi.mock("@/lib/api/guards", () => ({
  requireSameOrigin: () => null,
  requireUser: (...args: unknown[]) => mocks.requireUser(...args),
  rateLimit: () => ({ limited: false, error: null }),
  validateBody: (...args: unknown[]) => mocks.validateBody(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ from: mocks.from }),
}));

import { POST } from "../route";

function reqWith(): Request {
  return new Request("http://x", { method: "POST", body: "{}" });
}

function mockCacheMiss() {
  const select = vi.fn().mockReturnThis();
  const eq = vi.fn().mockReturnThis();
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  mocks.from.mockReturnValue({ select, eq, maybeSingle });
  return { select, eq, maybeSingle };
}

describe("gemini transcribe route", () => {
  beforeEach(() => {
    mocks.generateContent.mockReset();
    mocks.requireUser.mockReset();
    mocks.validateBody.mockReset();
    mocks.from.mockReset();

    process.env.GEMINI_API_KEY = "test";

    mocks.validateBody.mockResolvedValue({
      data: {
        audioDataUrl: "data:audio/webm;base64,ZmFrZQ==",
        targetWord: "focus",
      },
      error: null,
    });
  });

  it("scopes the Supabase cache lookup to the authenticated user", async () => {
    mocks.requireUser.mockResolvedValue({ user: { id: "user-a" }, error: null });
    mocks.generateContent.mockResolvedValue({ text: "transcript a" });
    const query = mockCacheMiss();

    const res = await POST(reqWith() as never);

    expect(res.status).toBe(200);
    expect(query.eq).toHaveBeenNthCalledWith(1, "user_id", "user-a");
    expect(query.eq).toHaveBeenNthCalledWith(2, "cache_key", expect.any(String));
  });

  it("does not reuse the in-memory cache across authenticated users", async () => {
    mocks.requireUser
      .mockResolvedValueOnce({ user: { id: "user-c" }, error: null })
      .mockResolvedValueOnce({ user: { id: "user-d" }, error: null });
    mocks.generateContent
      .mockResolvedValueOnce({ text: "transcript c" })
      .mockResolvedValueOnce({ text: "transcript d" });
    // Different targetWord avoids L1 cache collision with the previous test
    mocks.validateBody.mockResolvedValueOnce({
      data: {
        audioDataUrl: "data:audio/webm;base64,ZmFrZQ==",
        targetWord: "distinct-word",
      },
      error: null,
    });
    mockCacheMiss();
    mockCacheMiss();

    const first = await POST(reqWith() as never);
    const second = await POST(reqWith() as never);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(mocks.generateContent).toHaveBeenCalledTimes(2);
  });
});
