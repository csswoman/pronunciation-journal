import { afterEach, describe, expect, it, vi } from "vitest";
import { logServerError } from "@/lib/api/logging";

describe("logServerError", () => {
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
});
