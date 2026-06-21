import { beforeEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.fn();
const requireUser = vi.fn();
const validateBody = vi.fn();
const from = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

vi.mock("@/lib/api/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
  rateLimit: () => ({ limited: false, error: null }),
  validateBody: (...args: unknown[]) => validateBody(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ from }),
}));

function reqWith(): Request {
  return new Request("http://x", { method: "POST", body: "{}" });
}

function mockCacheMiss() {
  const select = vi.fn().mockReturnThis();
  const eq = vi.fn().mockReturnThis();
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  from.mockReturnValue({ select, eq, maybeSingle });
  return { select, eq, maybeSingle };
}

describe("gemini transcribe route", () => {
  beforeEach(() => {
    vi.resetModules();
    generateContent.mockReset();
    requireUser.mockReset();
    validateBody.mockReset();
    from.mockReset();

    process.env.GEMINI_API_KEY = "test";

    validateBody.mockResolvedValue({
      data: {
        audioDataUrl: "data:audio/webm;base64,ZmFrZQ==",
        targetWord: "focus",
      },
      error: null,
    });
  });

  it("scopes the Supabase cache lookup to the authenticated user", async () => {
    requireUser.mockResolvedValue({ user: { id: "user-a" }, error: null });
    generateContent.mockResolvedValue({ text: "transcript a" });
    const query = mockCacheMiss();

    const { POST } = await import("../route");
    const res = await POST(reqWith() as never);

    expect(res.status).toBe(200);
    expect(query.eq).toHaveBeenNthCalledWith(1, "user_id", "user-a");
    expect(query.eq).toHaveBeenNthCalledWith(2, "cache_key", expect.any(String));
  });

  it("does not reuse the in-memory cache across authenticated users", async () => {
    requireUser
      .mockResolvedValueOnce({ user: { id: "user-a" }, error: null })
      .mockResolvedValueOnce({ user: { id: "user-b" }, error: null });
    generateContent
      .mockResolvedValueOnce({ text: "transcript a" })
      .mockResolvedValueOnce({ text: "transcript b" });
    mockCacheMiss();
    mockCacheMiss();

    const { POST } = await import("../route");

    const first = await POST(reqWith() as never);
    const second = await POST(reqWith() as never);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
});
