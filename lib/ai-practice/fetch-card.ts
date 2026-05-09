import { makeStreamState, processChunk } from "./stream-processor";
import type { ToolCall, StreamChunk } from "./types";
import { isExerciseTool } from "./tools/registry";

const EXERCISE_PROMPTS = [
  "Give me a multiple choice grammar or vocabulary exercise.",
  "Give me a fill-in-the-blank sentence exercise.",
  "Give me a speaking or pronunciation exercise.",
];

export function cycleExercisePrompt(index: number): string {
  return EXERCISE_PROMPTS[index % EXERCISE_PROMPTS.length];
}

export async function fetchExerciseCard(
  prompt?: string,
  signal?: AbortSignal,
): Promise<ToolCall | null> {
  const message = prompt ?? EXERCISE_PROMPTS[Math.floor(Math.random() * EXERCISE_PROMPTS.length)];

  try {
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }],
        stream: true,
      }),
      signal,
    });

    if (!res.ok || !res.body) return null;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    const state = makeStreamState();

    outer: while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        let chunk: StreamChunk;
        try { chunk = JSON.parse(raw); } catch { continue; }

        const result = processChunk(chunk, state, {
          onSaveWord: () => {},
          onStartRoleplay: () => {},
          onActionToolResult: () => {},
          onError: () => {},
        });
        if (result === "done" || (typeof result === "object" && "error" in result)) break outer;
      }
    }

    for (const tc of state.calls.values()) {
      if (isExerciseTool(tc.name as never) && tc.status === "rendered") return tc;
    }
    return null;
  } catch (err) {
    if ((err as Error).name === "AbortError") return null;
    console.error("[fetchExerciseCard]", err);
    return null;
  }
}
