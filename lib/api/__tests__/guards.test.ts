import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const rpc = vi.fn();
const authGetUser = vi.fn();
const serverGetUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc, auth: { getUser: authGetUser } }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: serverGetUser },
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
    authGetUser.mockReset();
    serverGetUser.mockReset();
    serverGetUser.mockResolvedValue({ data: { user: null }, error: null });
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

  it("publicErrorResponse returns the status, message and secure headers", async () => {
    const { publicErrorResponse } = await loadGuards();

    const response = publicErrorResponse(404, "Not found");

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });

  describe("requireUser", () => {
    it("returns the user for a valid bearer token", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
      authGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
      const { requireUser } = await loadGuards();

      const result = await requireUser(
        new Request("https://app.example/api", {
          headers: { authorization: "Bearer abc123" },
        })
      );

      expect(authGetUser).toHaveBeenCalledWith("abc123");
      expect(result.user?.id).toBe("user-1");
      expect(result.error).toBeNull();
      expect(result.accessToken).toBe("abc123");
    });

    it("rejects an invalid bearer token with 401", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
      authGetUser.mockResolvedValue({ data: { user: null }, error: { message: "bad" } });
      const { requireUser } = await loadGuards();

      const result = await requireUser(
        new Request("https://app.example/api", {
          headers: { authorization: "Bearer bad" },
        })
      );

      expect(result.user).toBeNull();
      expect(result.error?.status).toBe(401);
    });

    it("returns 500 for a bearer request when Supabase env is missing", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const { requireUser } = await loadGuards();

      const result = await requireUser(
        new Request("https://app.example/api", {
          headers: { authorization: "Bearer abc" },
        })
      );

      expect(result.error?.status).toBe(500);
    });

    it("falls back to the cookie session and rejects when there is no user", async () => {
      const { requireUser } = await loadGuards();

      const result = await requireUser(new Request("https://app.example/api"));

      expect(serverGetUser).toHaveBeenCalled();
      expect(result.user).toBeNull();
      expect(result.error?.status).toBe(401);
      expect(result.accessToken).toBeNull();
    });

    it("returns the cookie-authenticated user when the session is valid", async () => {
      serverGetUser.mockResolvedValue({ data: { user: { id: "cookie-user" } }, error: null });
      const { requireUser } = await loadGuards();

      const result = await requireUser(new Request("https://app.example/api"));

      expect(result.user?.id).toBe("cookie-user");
      expect(result.accessToken).toBeNull();
    });
  });

  describe("createUserScopedClient", () => {
    it("throws when Supabase env is not configured", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const { createUserScopedClient } = await loadGuards();

      expect(() => createUserScopedClient("token")).toThrow(
        /environment variables are not configured/
      );
    });

    it("builds a client when env is configured", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
      const { createUserScopedClient } = await loadGuards();

      expect(createUserScopedClient("token")).toBeDefined();
    });
  });

  describe("validateBody", () => {
    const schema = z.object({ name: z.string() }).strict();

    it("returns 400 for invalid JSON", async () => {
      const { validateBody } = await loadGuards();

      const request = new Request("https://app.example/api", {
        method: "POST",
        body: "not json{",
      });
      const result = await validateBody(request, schema);

      expect(result.data).toBeNull();
      expect(result.error?.status).toBe(400);
      await expect(result.error?.json()).resolves.toEqual({ error: "Invalid JSON body" });
    });

    it("returns 400 with field issues when the schema fails", async () => {
      const { validateBody } = await loadGuards();

      const request = new Request("https://app.example/api", {
        method: "POST",
        body: JSON.stringify({ name: 123 }),
      });
      const result = await validateBody(request, schema);

      expect(result.error?.status).toBe(400);
      const payload = (await result.error?.json()) as {
        error: string;
        issues: { field: string; message: string }[];
      };
      expect(payload.error).toBe("Invalid request body");
      expect(payload.issues[0]?.field).toBe("name");
    });

    it("returns parsed data when valid", async () => {
      const { validateBody } = await loadGuards();

      const request = new Request("https://app.example/api", {
        method: "POST",
        body: JSON.stringify({ name: "Ana" }),
      });
      const result = await validateBody(request, schema);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({ name: "Ana" });
    });
  });

  describe("redactError", () => {
    it("handles non-object errors", async () => {
      const { redactError } = await loadGuards();

      expect(redactError("boom")).toEqual({ type: "UnknownError", message: "boom" });
    });

    it("extracts name, message and status", async () => {
      const { redactError } = await loadGuards();

      const result = redactError({ name: "ApiError", message: "failed", status: 503 });

      expect(result).toEqual({ type: "ApiError", message: "failed", status: 503 });
    });

    it("uses statusCode when status is absent", async () => {
      const { redactError } = await loadGuards();

      expect(redactError({ message: "x", statusCode: 418 }).status).toBe(418);
    });

    it("redacts long base64 sequences and truncates the message", async () => {
      const { redactError } = await loadGuards();

      const base64 = "A".repeat(150);
      const result = redactError({ message: `payload ${base64} tail` });

      expect(result.message).toContain("[redacted-base64]");
      expect(result.message.length).toBeLessThanOrEqual(200);
    });
  });
});
