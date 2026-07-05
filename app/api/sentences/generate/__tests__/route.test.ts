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
  rateLimit: async () => ({ limited: false, error: null }),
  validateBody: (...args: unknown[]) => validateBody(...args),
  publicErrorResponse: (status: number) => new Response(null, { status }) as never,
  SECURE_HEADERS: { "Cache-Control": "no-store" },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => createClient(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createClient(...args),
}));

import { POST } from "../route";

function reqWith(): NextRequest {
  return new NextRequest("http://localhost/api/sentences/generate", {
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
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "text_fragments") return textFragments;
      return {};
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue({ user: { id: "user-1" }, error: null });
  validateBody.mockResolvedValue({
    data: { topic: "travel", level: "B1" },
    error: null,
  });
  callWithFallback.mockImplementation(async (_apiKey, _params, parse) =>
    parse(JSON.stringify(["Travel by train feels calm and practical."]))
  );
  process.env.GEMINI_API_KEY = "test";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
});

describe("POST /api/sentences/generate", () => {
  it("returns 500 when Supabase config is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const res = await POST(reqWith() as never);

    expect(res.status).toBe(500);
  });

  it("returns generated rows when cache upsert fails", async () => {
    buildDbMock({ insertError: new Error("cache failed") });

    const res = await POST(reqWith() as never);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fromCache).toBe(false);
    expect(body.fragments).toHaveLength(1);
  });

  it("returns 502 when Gemini returns malformed sentence JSON", async () => {
    buildDbMock({ insertError: null });
    callWithFallback.mockImplementationOnce(async (_apiKey, _params, parse) =>
      parse(JSON.stringify({ sentences: ["not an array"] }))
    );

    const res = await POST(reqWith() as never);

    expect(res.status).toBe(502);
  });
});
