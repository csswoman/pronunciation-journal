import { describe, it, expect } from "vitest";
import { detectIntent, intentToToolConfig } from "../intent-detection";

describe("detectIntent", () => {
  describe("exercise_request", () => {
    it.each([
      "quiz me on articles",
      "test me",
      "give me an exercise",
      "give me a question",
      "let's practice",
      "I want to practice",
      "drill me on past tense",
    ])('detects "%s" as exercise_request', msg => {
      expect(detectIntent(msg).type).toBe("exercise_request");
    });
  });

  describe("explanation_request", () => {
    it.each([
      "explain the difference between a and the",
      "what is the past perfect?",
      "what does 'albeit' mean?",
      "how do I use subjunctive?",
      "tell me about conditional sentences",
      "why is this wrong?",
      "why do we use 'have been'?",
    ])('detects "%s" as explanation_request', msg => {
      expect(detectIntent(msg).type).toBe("explanation_request");
    });
  });

  describe("conversation", () => {
    it("short ambiguous message → conversation", () => {
      expect(detectIntent("hello").type).toBe("conversation");
    });

    it("long message without keyword → conversation", () => {
      const long = "I was walking to the store yesterday and something funny happened to me";
      expect(detectIntent(long).type).toBe("conversation");
    });
  });

  describe("SHORT_EXERCISE_CONTINUATIONS with context", () => {
    it.each(["harder", "easier", "again", "next", "more", "another", "ok", "yes", "sure", "go", "continue"])(
      '"%s" after exercise → exercise_request', word => {
        expect(detectIntent(word, true).type).toBe("exercise_request");
      }
    );

    it.each(["harder", "next", "more"])(
      '"%s" without exercise context → conversation', word => {
        expect(detectIntent(word, false).type).toBe("conversation");
      }
    );

    it("is case-insensitive for continuations", () => {
      expect(detectIntent("NEXT", true).type).toBe("exercise_request");
      expect(detectIntent("Ok", true).type).toBe("exercise_request");
    });

    it("ignores surrounding whitespace", () => {
      expect(detectIntent("  next  ", true).type).toBe("exercise_request");
    });
  });
});

describe("intentToToolConfig", () => {
  it("exercise_request → toolChoice any + exercise tools", () => {
    const config = intentToToolConfig({ type: "exercise_request" });
    expect(config.toolChoice).toBe("any");
    expect(config.allowedTools).toContain("render_multiple_choice");
    expect(config.allowedTools).toContain("render_fill_blank");
    expect(config.allowedTools).toContain("render_speaking");
    expect(config.allowedTools).toContain("render_word_card");
    expect(config.allowedTools).not.toContain("save_word");
  });

  it("explanation_request → toolChoice none + empty tools", () => {
    const config = intentToToolConfig({ type: "explanation_request" });
    expect(config.toolChoice).toBe("none");
    expect(config.allowedTools).toHaveLength(0);
  });

  it("conversation → toolChoice auto + action tools", () => {
    const config = intentToToolConfig({ type: "conversation" });
    expect(config.toolChoice).toBe("auto");
    expect(config.allowedTools).toContain("save_word");
    expect(config.allowedTools).toContain("start_roleplay");
    expect(config.allowedTools).not.toContain("render_multiple_choice");
  });
});
