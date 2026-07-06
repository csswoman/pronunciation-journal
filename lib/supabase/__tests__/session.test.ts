import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, createServerClient, cookies } = vi.hoisted(() => {
  const getUser = vi.fn();
  const createServerClient = vi.fn(() => ({
    auth: {
      getUser,
    },
  }));
  const cookies = vi.fn();
  return { getUser, createServerClient, cookies };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient,
}));

vi.mock("next/headers", () => ({
  cookies,
}));

vi.mock("server-only", () => ({}));

import { getSupabaseServerUser, getSupabaseServerUserId } from "../session";

describe("supabase server session helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    };
    cookies.mockResolvedValue({
      getAll: () => [],
      set: vi.fn(),
    });
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
      error: null,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("reuses the cached server client and user within one request", async () => {
    const [user, userId] = await Promise.all([
      getSupabaseServerUser(),
      getSupabaseServerUserId(),
    ]);

    expect(user?.id).toBe("user-1");
    expect(userId).toBe("user-1");
  });
});
