import { describe, it, expect } from "vitest";
import { STARTERS } from "../registry";
import { buildPronunciationStarterPrompt } from "@/lib/ai-prompts";
import { detectIntent, selectionForRequest } from "@/lib/ai-practice/intent-detection";
import type { StarterContext } from "../types";

/**
 * Regression: the learn starter rendered an empty bubble because its prompt
 * contains the word "exercise" (inside a *negative* instruction, "Do NOT call
 * any exercise tool on this first turn"). detectIntent matched the keyword,
 * classified the hidden starter send as an exercise_request, and the route
 * forced toolChoice "any" — which forbids plain text, so the model emitted a
 * tool call and no prose.
 *
 * Starters are prompts we author, not user speech, so the route must not run
 * them through natural-language intent detection at all.
 */

const ctx: StarterContext = {
  state: null,
  level: "B1",
  // An interest is required for the "world" starter to be available, and it
  // carries the same latent bug (its prompt opens with "Practice ...").
  interests: ["technology"],
  seed: 0,
  recentIds: [],
  recentAngles: [],
  now: 0,
};

const starterPrompts: Array<readonly [string, string]> = [
  ...STARTERS.filter(s => s.isAvailable(ctx)).map(s => [s.id, s.build(ctx).prompt] as const),
  ["pronunciation", buildPronunciationStarterPrompt({ level: "B1" })] as const,
];

describe("starter sends never force a tool call on turn 1", () => {
  it("covers every available starter", () => {
    expect(starterPrompts.map(([id]) => id).sort()).toEqual([
      "free",
      "learn",
      "pronunciation",
      "world",
    ]);
  });

  it.each(starterPrompts)('starter "%s" is not forced to call a tool', (_id, prompt) => {
    expect(selectionForRequest(prompt, true).toolChoice).not.toBe("any");
  });

  it("learn starter specifically — the reported bug", () => {
    const prompt = STARTERS.find(s => s.id === "learn")!.build(ctx).prompt;
    // The prompt genuinely contains the trigger keyword...
    expect(detectIntent(prompt).type).toBe("exercise_request");
    // ...but as a starter it must still be free to answer in prose.
    expect(selectionForRequest(prompt, true).toolChoice).toBe("auto");
  });

  it("a real user asking for an exercise is still forced to call one", () => {
    expect(selectionForRequest("quiz me on articles", false).toolChoice).toBe("any");
  });
});
