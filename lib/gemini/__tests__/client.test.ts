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

import { callWithFallback } from "../client";

describe("callWithFallback daily budget", () => {
  beforeEach(() => {
    mocks.generateContent.mockReset().mockResolvedValue({ text: "ok" });
    mocks.reserveModel.mockReset().mockResolvedValue(true);
    mocks.recordModelFailure.mockReset().mockResolvedValue(undefined);
    mocks.recordModelSuccess.mockReset().mockResolvedValue(undefined);
  });

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
});
