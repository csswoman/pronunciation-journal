import { afterEach, describe, expect, it, vi } from "vitest";
import { logServerError, redactForLog } from "@/lib/api/logging";

describe("Server Error Logging and Sensitive Data Redaction", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("does not emit console noise under Vitest by default", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logServerError("Gemini JSON route failed", new Error("boom"), {
      endpoint: "/api/test",
      operation: "callWithFallback",
      status: 500,
      userId: "user-1",
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("emits when DEBUG_API_LOGS=1 even under Vitest", () => {
    vi.stubEnv("DEBUG_API_LOGS", "1");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logServerError("Gemini JSON route failed", new Error("boom"), {
      endpoint: "/api/test",
      userId: "user-1",
    });

    expect(errorSpy).toHaveBeenCalledOnce();
    expect(errorSpy.mock.calls[0]?.[0]).toBe("Gemini JSON route failed");
  });

  it("never logs raw rate-limit keys that embed user ids", () => {
    vi.stubEnv("DEBUG_API_LOGS", "1");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const userId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

    logServerError(
      "Rate limit database check failed",
      new Error(`rpc failed for key gemini:user:/api/gemini:${userId}`),
      { endpoint: "rate-limit", operation: "consume" },
    );

    const payload = errorSpy.mock.calls[0]?.[1] as {
      error?: { message?: string };
    };
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain(userId);
    expect(payload?.error?.message).toContain("[redacted-id]");
  });

  it("redacts base64 payloads from error messages", () => {
    const hugeBase64 = "A".repeat(120) + "==";
    const error = new Error(`Failed to process audio chunk: ${hugeBase64}`);
    const redacted = redactForLog(error);

    expect(redacted.message).not.toContain(hugeBase64);
    expect(redacted.message).toContain("[redacted-base64]");
  });

  it("redacts Google API keys, OpenAI keys, JWT tokens, and Bearer tokens", () => {
    const apiKey = ["AIza", "SyD-1234567890abcdefghijklmnopqrstuvw"].join("");
    const jwt = ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", "eyJzdWIiOiIxMjM0NTY3ODkwIn0", "abcdefghijklmnopqrstuvw1234567890"].join(".");
    const skKey = ["sk", "-proj-abcdefghijklmnopqrstuvwxyz1234567890"].join("");
    const error = new Error(`SDK error with key ${apiKey}, token ${jwt} and ${skKey} Bearer mysecrettoken123`);

    const redacted = redactForLog(error);
    expect(redacted.message).not.toContain(apiKey);
    expect(redacted.message).not.toContain(jwt);
    expect(redacted.message).not.toContain(skKey);
    expect(redacted.message).toContain("[redacted-api-key]");
    expect(redacted.message).toContain("[redacted-jwt]");
    expect(redacted.message).toContain("[redacted-key]");
  });

  it("redacts emails from error messages", () => {
    const error = new Error("User student.test+123@example.com failed authentication in Supabase");
    const redacted = redactForLog(error);

    expect(redacted.message).not.toContain("student.test+123@example.com");
    expect(redacted.message).toContain("[redacted-email]");
  });

  it("redacts prompts, audio, and transcript fields from JSON-like error payloads", () => {
    const error = new Error(
      'Invalid Gemini payload: prompt: "What is the pronunciation of ephemeral?" transcript: "ephemeral sound" audio: "data:audio/ogg;base64,abc123456789012345678901234567890"',
    );
    const redacted = redactForLog(error);

    expect(redacted.message).not.toContain("What is the pronunciation of ephemeral?");
    expect(redacted.message).not.toContain("ephemeral sound");
    expect(redacted.message).toContain("[redacted-content]");
  });

  it("truncates excessively long messages to prevent memory/log dumps", () => {
    const longText = "Very long error message explaining internal database trace details. ".repeat(10);
    const error = new Error(longText);
    const redacted = redactForLog(error);

    expect(redacted.message.length).toBeLessThanOrEqual(180);
  });
});
