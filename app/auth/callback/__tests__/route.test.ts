import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildGoogleExistingAccountLoginPath } from "@/lib/auth/oauth-identity";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("resumes Google sign-in when linking hits identity_already_exists", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const request = new Request(
      "http://localhost:3000/auth/callback?error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked+to+another+user&next=%2F",
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `http://localhost:3000${buildGoogleExistingAccountLoginPath()}`,
    );
  });
});
