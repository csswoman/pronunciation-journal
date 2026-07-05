import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const requireAdmin = vi.fn();
const requireSameOrigin = vi.fn();
const rateLimit = vi.fn();
const validateBody = vi.fn();
const insert = vi.fn();

vi.mock("@/lib/api/require-admin", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

vi.mock("@/lib/api/guards", () => ({
  requireSameOrigin: (...args: unknown[]) => requireSameOrigin(...args),
  rateLimit: (...args: unknown[]) => rateLimit(...args),
  validateBody: (...args: unknown[]) => validateBody(...args),
  publicErrorResponse: (status: number, message: string) =>
    NextResponse.json({ error: message }, { status }),
  SECURE_HEADERS: {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    from: () => ({ insert }),
  }),
}));

import { POST } from "../route";

function makeRequest(): Request {
  return new Request("http://localhost/api/admin/seed", {
    method: "POST",
    headers: { origin: "http://localhost", "content-type": "application/json" },
    body: JSON.stringify({
      action: "insertSound",
      payload: {
        ipa: "æ",
        type: "vowel",
        category: "front",
        example: "cat",
        difficulty: 1,
      },
    }),
  });
}

beforeEach(() => {
  requireSameOrigin.mockReturnValue(null);
  rateLimit.mockResolvedValue({ limited: false, error: null });
  insert.mockResolvedValue({ error: null });
  validateBody.mockResolvedValue({
    data: {
      action: "insertSound",
      payload: {
        ipa: "æ",
        type: "vowel",
        category: "front",
        example: "cat",
        difficulty: 1,
      },
    },
    error: null,
  });
});

describe("POST /api/admin/seed", () => {
  it("returns 401 when admin auth fails", async () => {
    requireAdmin.mockResolvedValue({
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not admin", async () => {
    requireAdmin.mockResolvedValue({
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    });

    const res = await POST(makeRequest() as never);
    expect(res.status).toBe(403);
  });

  it("returns 201 when admin insert succeeds", async () => {
    requireAdmin.mockResolvedValue({ user: { id: "admin-1" }, error: null });

    const res = await POST(makeRequest() as never);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual({ ok: true });
    expect(insert).toHaveBeenCalled();
  });
});
