import { describe, expect, it } from "vitest";
import type { AIMessage } from "@/lib/ai-practice/types";
import {
  dropTrailingModelPlaceholder,
  shouldShowCoachTranscript,
} from "../coach-transcript-visibility";

const hiddenUser: AIMessage = {
  role: "user",
  content: "hi",
  hidden: true,
  timestamp: "2026-01-01T00:00:00.000Z",
};

const modelPlaceholder: AIMessage = {
  role: "model",
  contentParts: [],
  toolCalls: new Map(),
  timestamp: "2026-01-01T00:00:00.000Z",
};

describe("shouldShowCoachTranscript", () => {
  it("returns to home when the thread is empty and idle", () => {
    expect(
      shouldShowCoachTranscript({
        messages: [],
        isStreaming: false,
        error: null,
        quotaExhausted: false,
      }),
    ).toBe(false);
  });

  it("stays on chat while streaming even with only a hidden prompt", () => {
    expect(
      shouldShowCoachTranscript({
        messages: [hiddenUser, modelPlaceholder],
        isStreaming: true,
        error: null,
        quotaExhausted: false,
      }),
    ).toBe(true);
  });

  it("stays on chat when a failed first prompt left an error", () => {
    expect(
      shouldShowCoachTranscript({
        messages: [hiddenUser],
        isStreaming: false,
        error: "AI practice is unavailable right now.",
        quotaExhausted: false,
      }),
    ).toBe(true);
  });
});

describe("dropTrailingModelPlaceholder", () => {
  it("keeps the user turn after a failed stream", () => {
    expect(dropTrailingModelPlaceholder([hiddenUser, modelPlaceholder])).toEqual([
      hiddenUser,
    ]);
  });
});
