import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc, auth: { getUser: vi.fn() } }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
  }),
}));

const originalEnv = { ...process.env };

async function loadGuards() {
  vi.resetModules();
  return import("@/lib/api/guards");
}

describe("api guards", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    rpc.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = originalEnv;
  });

  it("blocks cookie-authenticated cross-site mutations without an origin", async () => {
    const { requireSameOrigin } = await loadGuards();

    const response = requireSameOrigin(new Request("https://app.example/api/gemini", { method: "POST" }));

    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toEqual({ error: "Cross-site request blocked" });
  });

  it("exempts bearer-token requests from the same-origin guard", async () => {
    const { requireSameOrigin } = await loadGuards();

    const response = requireSameOrigin(
      new Request("https://app.example/api/gemini", {
        method: "POST",
        headers: { authorization: "Bearer token" },
      })
    );

    expect(response).toBeNull();
  });

  it("uses the database rate limiter when service-role credentials exist", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    rpc.mockResolvedValue({
      data: { allowed: false, retry_after_seconds: 12 },
      error: null,
    });
    const { rateLimit } = await loadGuards();

    const result = await rateLimit("/api/gemini:user-1", { max: 1, windowMs: 60_000 });

    expect(rpc).toHaveBeenCalledWith("consume_rate_limit", {
      p_key: "/api/gemini:user-1",
      p_max: 1,
      p_window_ms: 60_000,
    });
    expect(result.limited).toBe(true);
    expect(result.error?.status).toBe(429);
    expect(result.error?.headers.get("Retry-After")).toBe("12");
  });

  it("falls back to in-memory limits when service-role credentials are absent", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { rateLimit } = await loadGuards();

    const first = await rateLimit("/api/gemini:user-2", { max: 1, windowMs: 60_000 });
    const second = await rateLimit("/api/gemini:user-2", { max: 1, windowMs: 60_000 });

    expect(rpc).not.toHaveBeenCalled();
    expect(first.limited).toBe(false);
    expect(second.limited).toBe(true);
    expect(second.error?.headers.get("Retry-After")).toBe("60");
  });
});
