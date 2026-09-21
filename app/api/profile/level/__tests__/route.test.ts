import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  validateBody: vi.fn(),
  tryGetSupabaseAdminClient: vi.fn(),
  upsert: vi.fn(),
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

vi.mock("@/lib/supabase/service-role", () => ({
  tryGetSupabaseAdminClient: mocks.tryGetSupabaseAdminClient,
}));

import { POST } from "../route";

function reqWith(body: unknown): Request {
  return new Request("http://x/api/profile/level", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mocks.validateBody.mockReset();
  mocks.tryGetSupabaseAdminClient.mockReset();
  mocks.upsert.mockReset();
});

describe("profile level route", () => {
  it("returns validation error when the body level is invalid", async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: null,
      error: Response.json({ error: "Invalid level" }, { status: 400 }),
    });

    const res = await POST(reqWith({ level: "INVALID" }) as never);

    expect(res.status).toBe(400);
    expect(mocks.tryGetSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("returns 500 when service role client is unavailable", async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: { level: "B2" },
      error: null,
    });
    mocks.tryGetSupabaseAdminClient.mockReturnValueOnce(null);

    const res = await POST(reqWith({ level: "B2" }) as never);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Service role client unavailable");
  });

  it("updates user_profiles with manual level via admin client", async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: { level: "B2" },
      error: null,
    });
    mocks.upsert.mockResolvedValueOnce({ error: null });
    mocks.tryGetSupabaseAdminClient.mockReturnValueOnce({
      from: (table: string) => {
        expect(table).toBe("user_profiles");
        return { upsert: mocks.upsert };
      },
    });

    const res = await POST(reqWith({ level: "B2" }) as never);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "u1",
        cefr_level: "B2",
        cefr_level_source: "manual",
      }),
      { onConflict: "id" },
    );
  });
});
