import type { AIMessage } from "./types";
import { BASE_TUTOR_PROMPT } from "./prompts";
import { compactState, selectNextExerciseTopic, type UserLearningState } from "./learning-state";
import { isExerciseTool } from "./tools/registry";

/** Returns the topic of the most recently answered exercise in the message list. */
export function extractLastTopic(messages: AIMessage[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "model") {
      for (const tc of msg.toolCalls.values()) {
        if (tc.status === "answered" && tc.result?.topic) return tc.result.topic;
      }
    }
  }
  return undefined;
}

export function buildSystemPrompt(
  learningState: UserLearningState | null,
  lastTopic?: string,
): string {
  if (!learningState) return BASE_TUTOR_PROMPT;

  const stateHint = compactState(learningState);
  const knownTopics = learningState.grammar.weakTopics.map(t => t.topic);
  const { topic, isNew } = selectNextExerciseTopic(learningState, knownTopics, lastTopic);

  const nextHint = isNew
    ? `Next exercise: introduce a NEW topic — "${topic}". Do not repeat the last topic.`
    : `Next exercise: focus on "${topic}" (student has struggled here). Do not repeat the last topic.`;

  return `${BASE_TUTOR_PROMPT}\n\n${stateHint}\n\n${nextHint}`;
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
