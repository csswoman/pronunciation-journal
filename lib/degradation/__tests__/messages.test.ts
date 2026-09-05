import { describe, expect, it } from "vitest";
import {
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
    expect(publicAiErrorMessage(429, "Gemini quota")).toMatch(/vuelve mañana|tokens/i);
    expect(DATA_UNAVAILABLE_MESSAGE).toMatch(/sync will retry/i);
  });

  it("returns public data degradation copy without database internals", () => {
    expect(publicDataErrorMessage()).toBe(DATA_UNAVAILABLE_MESSAGE);
    expect(publicDataErrorMessage()).not.toMatch(/postgres|supabase|rls|stack/i);
  });
});
