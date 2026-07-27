import { describe, it, expect } from "vitest";
import {
  messagesToWire,
  buildSystemPrompt,
  extractLastTopicFromWire,
  lastUserVoiceMetadataFromWire,
} from "../wire";
import { BASE_TUTOR_PROMPT, VOICE_TURN_INSTRUCTION } from "../prompts";
import { createEmptyState } from "../learning-state";
import type { AIMessage } from "../types";

// ─── messagesToWire: voice forwarding ───────────────────────────────────────

describe("messagesToWire", () => {
  it("forwards voice metadata on a scored spoken user turn", () => {
    const messages: AIMessage[] = [
      { role: "user", content: "hello", timestamp: "t", voice: { transcript: true, scored: true } },
    ];
    const wire = messagesToWire(messages);
    expect(wire[0]).toMatchObject({ role: "user", content: "hello", voice: { transcript: true, scored: true } });
  });

  it("omits voice metadata for a plain text turn", () => {
    const messages: AIMessage[] = [
      { role: "user", content: "hello", timestamp: "t" },
    ];
    const wire = messagesToWire(messages);
    expect(wire[0]).toEqual({ role: "user", content: "hello" });
    expect(wire[0]).not.toHaveProperty("voice");
  });

  it("forwards voice metadata with scored:false for an unscored voice turn", () => {
    const messages: AIMessage[] = [
      { role: "user", content: "hello", timestamp: "t", voice: { transcript: true, scored: false } },
    ];
    const wire = messagesToWire(messages);
    expect(wire[0].voice).toEqual({ transcript: true, scored: false });
  });
});

// ─── buildSystemPrompt: voice-conditional instruction ───────────────────────

describe("buildSystemPrompt voice instruction", () => {
  it("does not include the voice instruction for a plain text turn (no learning state)", () => {
    const prompt = buildSystemPrompt(null, undefined, false);
    expect(prompt).toBe(BASE_TUTOR_PROMPT);
    expect(prompt).not.toContain(VOICE_TURN_INSTRUCTION);
  });

  it("does not include the voice instruction when voiceScored is undefined", () => {
    const prompt = buildSystemPrompt(null);
    expect(prompt).not.toContain(VOICE_TURN_INSTRUCTION);
  });

  it("includes the voice instruction when the last user turn was a scored spoken turn (no learning state)", () => {
    const prompt = buildSystemPrompt(null, undefined, true);
    expect(prompt).toContain(VOICE_TURN_INSTRUCTION);
  });

  it("includes the voice instruction alongside learning-state hints", () => {
    const state = createEmptyState("u1", "d1");
    const prompt = buildSystemPrompt(state, undefined, true);
    expect(prompt).toContain(VOICE_TURN_INSTRUCTION);
    expect(prompt).toContain("Student:");
  });

  it("does not include the voice instruction for an unscored voice turn", () => {
    const prompt = buildSystemPrompt(null, undefined, false);
    expect(prompt).not.toContain(VOICE_TURN_INSTRUCTION);
  });

  it("renders the authored mission contract when a mission id is supplied", () => {
    const prompt = buildSystemPrompt(null, undefined, false, "roleplay.cafe");

    expect(prompt).toContain("ORAL MISSION: ROLEPLAY.CAFE");
    expect(prompt).toContain("mission_intent_observed");
    expect(prompt).toContain("placed_order");
    expect(prompt).not.toContain("undefined");
  });

  it("does not fall back to a different mission for an unknown id", () => {
    expect(buildSystemPrompt(null, undefined, false, "roleplay.unknown")).toBe(BASE_TUTOR_PROMPT);
  });
});

// ─── wire-shape helpers used by the route ───────────────────────────────────

describe("extractLastTopicFromWire", () => {
  it("returns undefined when there is no tool message", () => {
    expect(extractLastTopicFromWire([{ role: "user", content: "hi" }])).toBeUndefined();
  });

  it("returns the topic from the most recent tool message result", () => {
    const messages = [
      { role: "user" as const, content: "hi" },
      { role: "tool" as const, result: { topic: "grammar:simple_past_tense" } },
      { role: "user" as const, content: "more" },
    ];
    expect(extractLastTopicFromWire(messages)).toBe("grammar:simple_past_tense");
  });
});

describe("lastUserVoiceMetadataFromWire", () => {
  it("returns undefined when the last user message has no voice tag", () => {
    expect(lastUserVoiceMetadataFromWire([{ role: "user", content: "hi" }])).toBeUndefined();
  });

  it("returns the voice metadata from the most recent user message", () => {
    const messages = [
      { role: "user" as const, content: "hi", voice: { transcript: true as const, scored: true } },
    ];
    expect(lastUserVoiceMetadataFromWire(messages)).toEqual({ transcript: true, scored: true });
  });
});
