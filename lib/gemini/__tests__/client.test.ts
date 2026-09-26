import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateContent: vi.fn(),
  reserveModel: vi.fn(),
  recordModelFailure: vi.fn(),
  recordModelSuccess: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mocks.generateContent };
    constructor(options: unknown) { void options; }
  },
}));
vi.mock("@/lib/ai-usage/budget", () => ({
  reserveModel: mocks.reserveModel,
  recordModelFailure: mocks.recordModelFailure,
  recordModelSuccess: mocks.recordModelSuccess,
}));

import { callWithFallback, stripJsonFences, withGeminiTimeout } from "../client";

describe("withGeminiTimeout", () => {
  it("resolves when the promise settles before timeout", async () => {
    const res = await withGeminiTimeout(Promise.resolve("success"), 100);
    expect(res).toBe("success");
  });

  it("rejects with a timeout error when deadline is exceeded", async () => {
    const slowPromise = new Promise((resolve) => setTimeout(resolve, 200));
    await expect(withGeminiTimeout(slowPromise, 10)).rejects.toThrow("Gemini timeout after 10ms");
  });
});

describe("stripJsonFences", () => {
  it("removes json markdown fences and trims whitespace", () => {
    expect(stripJsonFences("```json\n{\"foo\":\"bar\"}\n```")).toBe("{\"foo\":\"bar\"}");
    expect(stripJsonFences("```\nsome text\n```")).toBe("some text");
    expect(stripJsonFences("  clean string  ")).toBe("clean string");
  });
});

describe("callWithFallback", () => {
  beforeEach(() => {
    mocks.generateContent.mockReset().mockResolvedValue({ text: "ok" });
    mocks.reserveModel.mockReset().mockResolvedValue(true);
    mocks.recordModelFailure.mockReset().mockResolvedValue(undefined);
    mocks.recordModelSuccess.mockReset().mockResolvedValue(undefined);
  });

  describe("daily budget", () => {
    it("skips a model with no reserved capacity without calling its SDK method", async () => {
      mocks.reserveModel.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

      const result = await callWithFallback(
        "test-key",
        { contents: "hello" },
        (text) => text,
        { models: ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite"], feature: "/api/gemini/test" },
      );

      expect(result).toBe("ok");
      expect(mocks.generateContent).toHaveBeenCalledTimes(1);
      expect(mocks.generateContent.mock.calls[0][0].model).toBe("gemini-3.5-flash-lite");
    });

    it("returns a retryable 429 without calling Gemini when every model is reserved out", async () => {
      mocks.reserveModel.mockResolvedValue(false);

      await expect(callWithFallback(
        "test-key",
        { contents: "hello" },
        (text) => text,
        { models: ["gemini-3.1-flash-lite"], feature: "/api/gemini/test" },
      )).rejects.toMatchObject({ status: 429 });
      expect(mocks.generateContent).not.toHaveBeenCalled();
    });

    it("bypasses budget reservation when skipBudgetReservation is true", async () => {
      const result = await callWithFallback(
        "test-key",
        { contents: "hello" },
        (text) => text,
        { models: ["gemini-3.1-flash-lite"], skipBudgetReservation: true }
      );

      expect(result).toBe("ok");
      expect(mocks.reserveModel).not.toHaveBeenCalled();
    });
  });

  describe("successful generation and parsing", () => {
    it("calls generateContent and records success", async () => {
      mocks.generateContent.mockResolvedValueOnce({ text: '{"ans": 42}' });

      const parsed = await callWithFallback(
        "test-key",
        { contents: "question" },
        (text) => JSON.parse(text),
        { models: ["gemini-3.1-flash-lite"] }
      );

      expect(parsed).toEqual({ ans: 42 });
      expect(mocks.recordModelSuccess).toHaveBeenCalledWith(
        "gemini-3.1-flash-lite",
        "gemini-unattributed",
        expect.any(Number)
      );
    });

    it("applies fast thinking config for thinking models", async () => {
      await callWithFallback(
        "test-key",
        { contents: "think" },
        (text) => text,
        { models: ["gemini-3.5-flash"] }
      );

      expect(mocks.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gemini-3.5-flash",
          config: expect.objectContaining({
            thinkingConfig: { thinkingBudget: 0 },
          }),
        })
      );
    });
  });

  describe("error handling and fallbacks", () => {
    it("throws error when response text is empty", async () => {
      mocks.generateContent.mockResolvedValueOnce({ text: "" });

      await expect(callWithFallback(
        "test-key",
        { contents: "test" },
        (text) => text,
        { models: ["gemini-3.1-flash-lite"] }
      )).rejects.toThrow("Empty response from AI");

      expect(mocks.recordModelFailure).toHaveBeenCalledTimes(1);
    });

    it("retries on retryable errors and succeeds on fallback model", async () => {
      const rateLimitErr = Object.assign(new Error("Rate limit"), { status: 429 });
      mocks.generateContent
        .mockRejectedValueOnce(rateLimitErr)
        .mockResolvedValueOnce({ text: "fallback ok" });

      const res = await callWithFallback(
        "test-key",
        { contents: "test" },
        (text) => text,
        { models: ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite"] }
      );

      expect(res).toBe("fallback ok");
      expect(mocks.recordModelFailure).toHaveBeenCalledWith(
        "gemini-3.1-flash-lite",
        "gemini-unattributed",
        429,
        "Error",
        expect.any(Number)
      );
    });

    it("throws immediately on non-retryable error without calling next model", async () => {
      const badReqErr = Object.assign(new Error("Bad Request"), { status: 400 });
      mocks.generateContent.mockRejectedValueOnce(badReqErr);

      await expect(callWithFallback(
        "test-key",
        { contents: "bad" },
        (text) => text,
        { models: ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite"] }
      )).rejects.toThrow("Bad Request");

      expect(mocks.generateContent).toHaveBeenCalledTimes(1);
    });

    it("throws 504 status when overall deadline is exceeded", async () => {
      let callCount = 0;
      // Simulate time passing beyond totalTimeoutMs
      vi.spyOn(Date, "now").mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 1000 : 100000;
      });

      try {
        await expect(callWithFallback(
          "test-key",
          { contents: "slow" },
          (text) => text,
          { totalTimeoutMs: 1000, models: ["gemini-3.1-flash-lite"] }
        )).rejects.toMatchObject({ status: 504, message: expect.stringContaining("timed out") });
      } finally {
        vi.spyOn(Date, "now").mockRestore();
      }
    });

    it("throws last error or fallback failed when loop completes without success", async () => {
      const err = new Error("Custom error");
      mocks.generateContent.mockRejectedValue(err);

      await expect(callWithFallback(
        "test-key",
        { contents: "fail" },
        (text) => text,
        { models: ["gemini-3.1-flash-lite"], shouldRetry: () => true }
      )).rejects.toThrow("Custom error");
    });
  });
});
