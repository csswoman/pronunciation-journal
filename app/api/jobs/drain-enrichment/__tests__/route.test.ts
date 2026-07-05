import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const enrichWord = vi.fn();
const rpc = vi.fn();
const update = vi.fn();
const eq = vi.fn();
const from = vi.fn();

vi.mock("@/lib/word-bank/enrich", () => ({
  enrichWord: (...args: unknown[]) => enrichWord(...args),
}));

vi.mock("@/lib/api/guards", () => ({
  redactError: (err: unknown) => ({ type: "Error", message: err instanceof Error ? err.message : String(err) }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc, from }),
}));

import { GET } from "../route";

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/jobs/drain-enrichment", {
    headers: { authorization: "Bearer cron-secret" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "test");
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
  process.env.CRON_SECRET = "cron-secret";

  rpc.mockResolvedValue({
    data: [{ id: "job-1", word_id: "word-1", attempts: 0 }],
    error: null,
  });

  eq.mockReturnValue({ update });
  update.mockReturnValue({ eq });
  from.mockReturnValue({ update });
  enrichWord.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/jobs/drain-enrichment", () => {
  it("clears locks and last_error when a job succeeds", async () => {
    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "succeeded",
        locked_at: null,
        locked_by: null,
        last_error: null,
      })
    );
  });

  it("rejects missing cron secret in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const req = new NextRequest("http://localhost/api/jobs/drain-enrichment");

    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});
