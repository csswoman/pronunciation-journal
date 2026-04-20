import type { AIMessage } from "./types";
import { BASE_TUTOR_PROMPT } from "./prompts";
import { compactState, type UserLearningState } from "./learning-state";
import { isExerciseTool } from "./tools/registry";

export function buildSystemPrompt(learningState: UserLearningState | null): string {
  if (!learningState) return BASE_TUTOR_PROMPT;
  return `${BASE_TUTOR_PROMPT}\n\n${compactState(learningState)}`;
}

export function lastModelHadExercise(messages: AIMessage[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "model") {
      return msg.toolCalls.size > 0 && [...msg.toolCalls.values()].some(tc => isExerciseTool(tc.name as never));
    }
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function messagesToWire(messages: AIMessage[]): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return messages.map((m): any => {
    if (m.role === "user") return { role: "user", content: m.content };
    if (m.role === "tool") {
      return { role: "tool", toolCallId: m.toolCallId, name: m.name, result: m.result };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [];
    for (const part of m.contentParts) {
      if (part.type === "text") {
        parts.push({ text: part.text });
      } else {
        const tc = m.toolCalls.get(part.callId);
        if (tc) parts.push({ functionCall: { name: tc.name, args: tc.args } });
      }
    }
    return { role: "model", parts };
  });
}
