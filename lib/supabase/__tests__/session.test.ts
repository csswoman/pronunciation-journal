import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getClaims, getSession, createServerClient, cookies } = vi.hoisted(() => {
  const getClaims = vi.fn();
  const getSession = vi.fn();
  const createServerClient = vi.fn(() => ({
    auth: {
      getClaims,
      getSession,
    },
  }));
  const cookies = vi.fn();
  return { getClaims, getSession, createServerClient, cookies };
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
    getClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "user-1",
          aud: "authenticated",
          email: "test@example.com",
          role: "authenticated",
          is_anonymous: false,
          user_metadata: { full_name: "Ada" },
          app_metadata: { provider: "email" },
        },
      },
      error: null,
    });
    getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1", email: "test@example.com" } } },
      error: null,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("maps verified claims to a user without reading the unverified cookie session", async () => {
    const [user, userId] = await Promise.all([
      getSupabaseServerUser(),
      getSupabaseServerUserId(),
    ]);

    expect(user?.id).toBe("user-1");
    expect(user?.email).toBe("test@example.com");
    expect(user?.is_anonymous).toBe(false);
    expect(user?.user_metadata).toEqual({ full_name: "Ada" });
    expect(userId).toBe("user-1");
    expect(getClaims).toHaveBeenCalled();
    expect(getSession).not.toHaveBeenCalled();
  });
});
