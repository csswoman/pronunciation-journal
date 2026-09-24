import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/service-role", () => ({
  tryGetSupabaseAdminClient: () => ({ rpc: mocks.rpc }),
}));
vi.mock("@/lib/api/logging", () => ({ logServerError: vi.fn() }));

import { DAILY_BUDGET, reserveModel } from "../budget";

describe("AI daily model budget", () => {
  beforeEach(() => mocks.rpc.mockReset());

  it("uses the configured 80 percent daily reservation limit", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: false, error: null });

    const reserved = await reserveModel("gemini-3.1-flash-lite", "/api/gemini/test");

    expect(reserved).toBe(false);
    expect(mocks.rpc).toHaveBeenCalledWith("ai_usage_try_reserve", {
      p_model: "gemini-3.1-flash-lite",
      p_feature: "/api/gemini/test",
      p_limit: 400,
    });
    expect(DAILY_BUDGET["gemini-3.8-flash-tts"]).toBe(8);
  });

  it("fails open on RPC errors and rejects models outside the free allowlist", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: new Error("database offline") });

    await expect(reserveModel("gemini-3.1-flash-lite", "test")).resolves.toBe(true);
    await expect(reserveModel("unknown-paid-model", "test")).resolves.toBe(false);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
});
