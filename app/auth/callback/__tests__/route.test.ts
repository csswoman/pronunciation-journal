import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildGoogleExistingAccountLoginPath } from "@/lib/auth/oauth-identity";

const redirectAfterClearingSession = vi.hoisted(() =>
  vi.fn(async (_request: NextRequest, location: string) =>
    NextResponse.redirect(location),
  ),
);

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/redirect-after-sign-out", () => ({
  redirectAfterClearingSession,
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.resetModules();
    redirectAfterClearingSession.mockClear();
  });

  it("clears the guest session then resumes Google sign-in on identity_already_exists", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const request = new NextRequest(
      "http://localhost:3000/auth/callback?error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked+to+another+user&next=%2F",
    );

    const response = await GET(request);

    expect(redirectAfterClearingSession).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `http://localhost:3000${buildGoogleExistingAccountLoginPath()}`,
    );
  });
});
