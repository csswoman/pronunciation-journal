import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { GoogleGenAI } from "@google/genai";
import { buildSystemPrompt } from "@/lib/ai-practice/wire";
import { intentToToolConfig } from "@/lib/ai-practice/intent-detection";
import { streamWithFallback } from "@/lib/gemini/chat-route";
import type { StreamChunk } from "@/lib/ai-practice/types";

describe("AI Coach exercise sets against the real model chain", () => {
  beforeAll(() => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required — run with the real env loaded");
    }
  });

  it("emits five exercise tool calls in one turn", async () => {
    const chunks: StreamChunk[] = [];
    const decoder = new TextDecoder();
    const controller = {
      enqueue(bytes: Uint8Array) {
        for (const line of decoder.decode(bytes).split("\n\n")) {
          const raw = line.replace(/^data: /, "").trim();
          if (raw) chunks.push(JSON.parse(raw) as StreamChunk);
        }
      },
      close() {},
    } as unknown as ReadableStreamDefaultController;

    await streamWithFallback(
      new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }),
      buildSystemPrompt(null, { exerciseRequested: true, learnerLevel: "A2" }),
      [],
      "Quiz me on the simple past.",
      intentToToolConfig({ type: "exercise_request" }),
      controller,
      new AbortController().signal,
    );

    const starts = chunks.filter((chunk) => chunk.type === "tool_call_start");
    expect(starts, `stream chunks: ${JSON.stringify(chunks)}`).toHaveLength(5);
  }, 45_000);
});
