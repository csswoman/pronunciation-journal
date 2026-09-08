import { describe, expect, it } from "vitest";
import {
  AI_COACH_RATE_LIMITED_MESSAGE,
  AI_QUOTA_EXHAUSTED_MESSAGE,
  AI_SESSION_REQUIRED_MESSAGE,
  AI_UNAVAILABLE_MESSAGE,
  DATA_UNAVAILABLE_MESSAGE,
  isQuotaLikeError,
  publicAiErrorMessage,
  publicDataErrorMessage,
} from "@/lib/degradation/messages";

describe("degradation messages", () => {
  it("detects quota-like provider errors", () => {
    expect(isQuotaLikeError("Resource exhausted: quota exceeded")).toBe(true);
    expect(isQuotaLikeError("HTTP 429")).toBe(true);
    expect(isQuotaLikeError("database password leaked")).toBe(false);
  });

  it("returns public AI degradation copy without provider internals", () => {
    expect(publicAiErrorMessage(503, "Gemini stack trace")).toBe(AI_UNAVAILABLE_MESSAGE);
    expect(publicAiErrorMessage(401, "Unauthorized")).toBe(AI_SESSION_REQUIRED_MESSAGE);
    expect(publicAiErrorMessage(429, "Gemini quota")).toBe(AI_QUOTA_EXHAUSTED_MESSAGE);
    expect(DATA_UNAVAILABLE_MESSAGE).toMatch(/sync will retry/i);
  });

  it("keeps the transient rate-limit copy distinct from the quota wall", () => {
    // The short throttle must not claim a daily/provider limit or a 24 h wait,
    // and must reassure the user their conversation is intact.
    expect(AI_COACH_RATE_LIMITED_MESSAGE).not.toMatch(/24 h|24 horas|diario|de la IA/i);
    expect(AI_COACH_RATE_LIMITED_MESSAGE).toMatch(/segundos|momento|un poco/i);
    expect(AI_COACH_RATE_LIMITED_MESSAGE).not.toBe(AI_QUOTA_EXHAUSTED_MESSAGE);
  });

  it("keeps the quota wall copy free of provider internals and hard 24 h claims", () => {
    expect(AI_QUOTA_EXHAUSTED_MESSAGE).not.toMatch(/gemini|token|24 horas/i);
  });

  it("returns public data degradation copy without database internals", () => {
    expect(publicDataErrorMessage()).toBe(DATA_UNAVAILABLE_MESSAGE);
    expect(publicDataErrorMessage()).not.toMatch(/postgres|supabase|rls|stack/i);
  });
});
