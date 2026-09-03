import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const callWithFallback = vi.fn();
const requireUser = vi.fn();
const validateBody = vi.fn();
const upsert = vi.fn();
const select = vi.fn();
const eq = vi.fn();
const is = vi.fn();
const limit = vi.fn();
const createClient = vi.fn();

vi.mock("@/lib/gemini/client", () => ({
  callWithFallback: (...args: unknown[]) => callWithFallback(...args),
  stripJsonFences: (text: string) => text,
}));

vi.mock("@/lib/api/guards", () => ({
  requireSameOrigin: () => null,
  requireUser: (...args: unknown[]) => requireUser(...args),
  checkLayeredRateLimit: async () => ({ limited: false, error: null }),
  validateBody: (...args: unknown[]) => validateBody(...args),
  publicErrorResponse: (status: number) => new Response(null, { status }) as never,
  SECURE_HEADERS: { "Cache-Control": "no-store" },
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: (...args: unknown[]) => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase admin credentials missing");
    }
    return createClient(...args);
  },
}));

import { POST } from "../route";

function reqWith(): NextRequest {
  return new NextRequest("http://localhost/api/gemini/generate-sentences", {
    method: "POST",
    body: JSON.stringify({ topic: "travel" }),
  });
}

function buildDbMock({ insertError }: { insertError: unknown }) {
  select.mockReturnThis();
  eq.mockReturnThis();
  is.mockReturnThis();
  limit.mockReturnThis();
  upsert.mockReturnValue({
    select: vi.fn().mockResolvedValue({ data: null, error: insertError }),
  });

  const textFragments = {
    select,
    eq,
    is,
    limit,
    upsert,
  };

  createClient.mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === "text_fragments") return textFragments;
      throw new Error(`Unexpected table: ${table}`);
    }),
  });
}

describe("POST /api/gemini/generate-sentences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

    requireUser.mockResolvedValue({
      user: { id: "user-123" },
      error: null,
    });
    validateBody.mockResolvedValue({
      data: { topic: "travel", level: "B1", count: 2 },
      error: null,
    });
    callWithFallback.mockResolvedValue([
      "The train arrives at six in the morning.",
      "She booked a quiet hotel near the station.",
    ]);
  });

  it("returns 500 when Supabase admin credentials are missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    buildDbMock({ insertError: null });

    const res = await POST(reqWith());
    expect(res.status).toBe(500);
  });

  it("returns sentences even when caching in text_fragments fails", async () => {
    buildDbMock({ insertError: new Error("insert failed") });

    const res = await POST(reqWith());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.fromCache).toBe(false);
    expect(body.fragments).toHaveLength(2);
    expect(body.fragments[0].content).toBe("The train arrives at six in the morning.");
  });

  it("returns sentences on success when caching succeeds", async () => {
    buildDbMock({ insertError: null });

    const res = await POST(reqWith());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.fromCache).toBe(false);
    expect(body.fragments).toHaveLength(2);
  });
});
