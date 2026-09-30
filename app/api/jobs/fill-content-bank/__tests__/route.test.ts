import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const rpc = vi.fn();
const upsert = vi.fn();
const from = vi.fn();
const select = vi.fn();
const eq = vi.fn();
const limit = vi.fn();
const generateBankSet = vi.fn();
const isModelOverQuotaThreshold = vi.fn();
const reserveModel = vi.fn();
const pickNextGenerationTargets = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({ rpc, from }),
}));

vi.mock("@/lib/content-bank/generate", () => ({
  generateBankSet: (...args: unknown[]) => generateBankSet(...args),
}));

vi.mock("@/lib/content-bank/budget-check", () => ({
  DEFAULT_BANK_MODEL: "gemini-3.1-flash-lite",
  CONTENT_BANK_DAILY_REQUEST_LIMIT: 240,
  CONTENT_BANK_QUOTA_RATIO: 0.6,
  isModelOverQuotaThreshold: (...args: unknown[]) => isModelOverQuotaThreshold(...args),
}));

vi.mock("@/lib/ai-usage/budget", () => ({
  reserveModel: (...args: unknown[]) => reserveModel(...args),
}));

vi.mock("@/lib/content-bank/targets", () => ({
  pickNextGenerationTargets: (...args: unknown[]) => pickNextGenerationTargets(...args),
}));

import { GET } from "../route";

function makeRequest(secret = "cron-secret"): NextRequest {
  return new NextRequest("http://localhost/api/jobs/fill-content-bank", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "test");
  process.env.CRON_SECRET = "cron-secret";

  limit.mockResolvedValue({ data: [], error: null });
  eq.mockReturnValue({ eq, limit });
  select.mockReturnValue({ eq, limit });
  upsert.mockResolvedValue({ error: null });
  from.mockReturnValue({ select, upsert, eq });

  isModelOverQuotaThreshold.mockResolvedValue(false);
  reserveModel.mockResolvedValue(true);
  pickNextGenerationTargets.mockResolvedValue([
    { level: "A2", topicId: "past_simple" },
    { level: "A2", topicId: "daily_routines" },
    { level: "B1", topicId: "prepositions" },
    { level: "B1", topicId: "present_perfect" },
  ]);
  generateBankSet.mockResolvedValue([
    {
      tool_name: "render_multiple_choice",
      payload: { question: "Q1", options: ["A", "B"], correctIndex: 0 },
      stem_hash: "hash1",
    },
  ]);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/jobs/fill-content-bank", () => {
  it("rejects request without cron secret in production with 401", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const req = makeRequest("");
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(generateBankSet).not.toHaveBeenCalled();
  });

  it("does 0 calls to generator when budget usage is over 60%", async () => {
    isModelOverQuotaThreshold.mockResolvedValue(true);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.processedSets).toBe(0);
    expect(generateBankSet).not.toHaveBeenCalled();
  });

  it("stops if reserveModel fails", async () => {
    reserveModel.mockResolvedValue(false);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.processedSets).toBe(0);
    expect(generateBankSet).not.toHaveBeenCalled();
  });

  it("processes up to 4 sets in normal case and upserts them", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.processedSets).toBe(4);
    expect(data.itemsInserted).toBe(4);
    expect(generateBankSet).toHaveBeenCalledTimes(4);
    expect(upsert).toHaveBeenCalledTimes(4);
  });
});
