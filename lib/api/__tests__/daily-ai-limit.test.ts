import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import { checkDailyAiUserLimit, checkLayeredRateLimit, _resetRateLimitMemoryStore } from "../rate-limit";
import { getNextPacificMidnight, getPacificDateKey } from "../pacific-time";

const permanentUser: User = {
  id: "daily-permanent-user",
  app_metadata: { provider: "email" },
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

const anonymousUser: User = {
  id: "daily-anonymous-user",
  is_anonymous: true,
  app_metadata: { provider: "anonymous" },
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

beforeEach(() => {
  _resetRateLimitMemoryStore();
  vi.unstubAllEnvs();
});

describe("Gemini daily user cap", () => {
  it("limits a permanent account across Gemini routes and returns the Pacific reset", async () => {
    vi.stubEnv("GEMINI_DAILY_LIMIT_PER_USER", "2");
    const request = new Request("https://example.com/api/gemini/grade-production", {
      headers: { "x-real-ip": "198.51.100.222" },
    });
    const options = {
      request,
      user: permanentUser,
      endpoint: "/api/gemini/grade-production",
      maxPermanent: 15,
      maxAnonymous: 3,
    };

    expect((await checkLayeredRateLimit(options)).limited).toBe(false);
    expect((await checkDailyAiUserLimit(permanentUser, "/api/assessment/oral/evidence")).limited).toBe(false);
    const blocked = await checkLayeredRateLimit(options);

    expect(blocked.limited).toBe(true);
    expect(blocked.error?.status).toBe(429);
    expect(blocked.error?.headers.get("Retry-After")).toBeTruthy();
    const body = await blocked.error!.json();
    expect(body.code).toBe("AI_DAILY_LIMIT");
    expect(body.error).toContain("límite diario");
    expect(body.error).toContain("hora del Pacífico");
    expect(new Date(body.resetAt).toISOString()).toBe(body.resetAt);
  });

  it("uses a separate configurable cap for anonymous users", async () => {
    vi.stubEnv("GEMINI_DAILY_LIMIT_ANONYMOUS", "1");
    const options = {
      request: new Request("https://example.com/api/gemini/translate", {
        headers: { "x-real-ip": "198.51.100.223" },
      }),
      user: anonymousUser,
      endpoint: "/api/gemini/translate",
      maxPermanent: 15,
      maxAnonymous: 3,
    };

    expect((await checkLayeredRateLimit(options)).limited).toBe(false);
    const blocked = await checkLayeredRateLimit(options);
    expect(blocked.limited).toBe(true);
    expect((await blocked.error!.json()).code).toBe("AI_DAILY_LIMIT");
  });

  it("does not cap non-Gemini routes", async () => {
    vi.stubEnv("GEMINI_DAILY_LIMIT_PER_USER", "1");
    const options = {
      request: new Request("https://example.com/api/words/preview", {
        headers: { "x-real-ip": "198.51.100.224" },
      }),
      user: permanentUser,
      endpoint: "/api/words/preview",
      maxPermanent: 15,
      maxAnonymous: 3,
    };
    expect((await checkLayeredRateLimit(options)).limited).toBe(false);
    expect((await checkLayeredRateLimit(options)).limited).toBe(false);
  });

  it("uses Pacific calendar dates and handles a DST offset change", () => {
    const beforeMidnight = new Date("2026-09-24T06:59:00.000Z");
    expect(getPacificDateKey(beforeMidnight)).toBe("2026-09-23");
    expect(getNextPacificMidnight(beforeMidnight).toISOString()).toBe("2026-09-24T07:00:00.000Z");

    const afterFallBack = new Date("2026-11-01T18:00:00.000Z");
    expect(getPacificDateKey(afterFallBack)).toBe("2026-11-01");
    expect(getNextPacificMidnight(afterFallBack).toISOString()).toBe("2026-11-02T08:00:00.000Z");
  });
});
