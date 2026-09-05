import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signOut, createServerClient } = vi.hoisted(() => {
  const signOut = vi.fn().mockResolvedValue({ error: null });
  const createServerClient = vi.fn(() => ({
    auth: { signOut },
  }));
  return { signOut, createServerClient };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient,
}));

describe("redirectAfterClearingSession", () => {
  beforeEach(() => {
    vi.resetModules();
    signOut.mockClear();
    createServerClient.mockClear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("signs out on the redirect response so guest cookies are dropped", async () => {
    const { redirectAfterClearingSession } = await import(
      "@/lib/supabase/redirect-after-sign-out"
    );
    const request = new NextRequest("http://localhost:3000/auth/callback");

    const response = await redirectAfterClearingSession(
      request,
      "http://localhost:3000/login?intent=save&oauth_resume=google",
    );

    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?intent=save&oauth_resume=google",
    );
  });
});
