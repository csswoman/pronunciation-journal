import { describe, it, expect, beforeAll } from "vitest";
import { GoogleGenAI } from "@google/genai";
import { streamWithFallback } from "@/lib/gemini/chat-route";
import { buildSystemPrompt } from "@/lib/ai-practice/wire";
import { intentToToolConfig } from "@/lib/ai-practice/intent-detection";
import { makeStreamState, processChunk } from "@/lib/ai-practice/stream-processor";
import { extractTurnCorrection } from "@/lib/ai-practice/correction";
import type { StreamChunk, ToolCall } from "@/lib/ai-practice/types";

// Turns a Spanish-speaking learner would realistically write.
const TURNS_NEEDING_CORRECTION = [
  "I go to the cinema yesterday with my friends",
  "Yesterday I have eaten pizza in a restaurant very good",
  "I am agree with you about this topic",
  "She don't like to study English in the morning",
  "I have 25 years old and I work in a company of technology",
];

const TURNS_NEEDING_NO_CORRECTION = [
  "I went to the cinema yesterday with my friends.",
  "I completely agree with you on that.",
  "She doesn't like studying English in the morning.",
];

type CoachTurn = { text: string; calls: Map<string, ToolCall> };

/** Runs one turn through the real production path and assembles the result. */
async function coachTurn(userText: string): Promise<CoachTurn> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const systemPrompt = buildSystemPrompt(null, { interests: ["technology", "films"] });
  const selection = intentToToolConfig({ type: "conversation" });

  const chunks: StreamChunk[] = [];
  const decoder = new TextDecoder();

  // streamWithFallback only ever calls enqueue/close on the controller.
  const controller = {
    enqueue(bytes: Uint8Array) {
      for (const line of decoder.decode(bytes).split("\n\n")) {
        const trimmed = line.replace(/^data: /, "").trim();
        if (trimmed) chunks.push(JSON.parse(trimmed) as StreamChunk);
      }
    },
    close() {},
  } as unknown as ReadableStreamDefaultController;

  await streamWithFallback(
    ai,
    systemPrompt,
    [],
    userText,
    selection,
    controller,
    new AbortController().signal,
  );

  const state = makeStreamState();
  for (const chunk of chunks) {
    processChunk(chunk, state, {
      onSaveWord: () => {},
      onActionToolResult: () => {},
      onError: () => {},
    });
  }

  const text = state.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  return { text, calls: state.calls };
}

describe("annotate_turn against the real model chain", () => {
  beforeAll(() => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required — run with the real env loaded");
    }
  });

  it.each(TURNS_NEEDING_CORRECTION)(
    "corrects: %s",
    async (userText) => {
      const { calls } = await coachTurn(userText);
      const correction = extractTurnCorrection(calls);

      expect(correction, "model produced no correction for a faulty turn").not.toBeNull();
      expect(correction?.original).toBeTruthy();
      expect(correction?.corrected).toBeTruthy();
      expect(correction?.corrected).not.toBe(correction?.original);
    },
    30_000,
  );

  it.each(TURNS_NEEDING_NO_CORRECTION)(
    "stays silent on correct English: %s",
    async (userText) => {
      const { calls } = await coachTurn(userText);
      expect(extractTurnCorrection(calls)).toBeNull();
    },
    30_000,
  );

  it("writes conversational prose alongside the tool call", async () => {
    const { text, calls } = await coachTurn(TURNS_NEEDING_CORRECTION[0]);
    expect(extractTurnCorrection(calls)).not.toBeNull();
    expect(text.trim().length).toBeGreaterThan(20);
  });
});
