import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    rpc,
  }),
}));

import { GET } from "../route";

describe("GET /api/health/ready", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      GEMINI_API_KEY: "test-gemini-key",
    };
    rpc.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns degraded when Supabase env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const res = await GET();

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.supabase.status).toBe("error");
  });

  it("returns ready when dependencies are healthy", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ready");
    expect(body.checks.supabase.status).toBe("ok");
    expect(body.checks.gemini.status).toBe("ok");
    expect(body.version).toBeDefined();
  });

  it("returns degraded when Supabase check fails", async () => {
    rpc.mockResolvedValueOnce({ error: { message: "network timeout" } });

    const res = await GET();

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.supabase.message).toContain("network timeout");
  });
});
