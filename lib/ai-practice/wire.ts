import type { AIMessage, VoiceMetadata } from "./types";
import { BASE_TUTOR_PROMPT, VOICE_TURN_INSTRUCTION } from "./prompts";
import { compactState, selectNextExerciseTopic, type UserLearningState } from "./learning-state";
import { isExerciseTool } from "./tools/registry";
import { buildMissionPrompt } from "./missions/prompts";
import { getMission } from "./missions/registry";
import { isConversationalMission } from "./missions/types";

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

export interface SystemPromptOptions {
  lastTopic?: string;
  voiceScored?: boolean;
  missionId?: string;
  /** Interests the student picked in their profile (lib/users/interests.ts). */
  interests?: readonly string[];
}

function interestsBlock(interests: readonly string[] | undefined): string {
  if (!interests?.length) return "";
  return `

The student's declared interests: ${interests.join(", ")}.
Ground your examples, scenarios and vocabulary in these areas whenever it fits
naturally. Do NOT force every message into them, and do NOT announce that you
are using their interests.`;
}

export function buildSystemPrompt(
  learningState: UserLearningState | null,
  options: SystemPromptOptions = {},
): string {
  const { lastTopic, voiceScored, missionId, interests } = options;
  const voiceSuffix = voiceScored ? `

${VOICE_TURN_INSTRUCTION}` : "";
  const interestsSuffix = interestsBlock(interests);

  const mission = missionId ? getMission(missionId) : null;
  if (mission && isConversationalMission(mission)) {
    const missionPrompt = buildMissionPrompt(
      mission,
      learningState ? compactState(learningState) : undefined,
    );
    return `${missionPrompt}${interestsSuffix}${voiceSuffix}`;
  }

  if (!learningState) return `${BASE_TUTOR_PROMPT}${interestsSuffix}${voiceSuffix}`;

  const stateHint = compactState(learningState);
  const knownTopics = learningState.grammar.weakTopics.map(t => t.topic);
  const { topic, isNew } = selectNextExerciseTopic(learningState, knownTopics, lastTopic);

  const nextHint = isNew
    ? `Next exercise: introduce a NEW topic — "${topic}". Do not repeat the last topic.`
    : `Next exercise: focus on "${topic}" (student has struggled here). Do not repeat the last topic.`;

  return `${BASE_TUTOR_PROMPT}

${stateHint}

${nextHint}${interestsSuffix}${voiceSuffix}`;
}

/** Returns the `voice` metadata of the most recent user message, if any. */
export function lastUserVoiceMetadata(messages: AIMessage[]): VoiceMetadata | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "user") return msg.voice;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Wire-shape helpers — operate on the server's validated request body
// (`GeminiRequestSchema` in app/api/gemini/route.ts), which is a plain JSON
// shape distinct from the client-side `AIMessage` union above (no `Map`s).
// ---------------------------------------------------------------------------

type WireMessage = {
  role: "user" | "model" | "tool";
  content?: string;
  voice?: VoiceMetadata;
  result?: unknown;
};

/** Wire-shape counterpart to `extractLastTopic`: reads `topic` off the most

 * recent `tool` message's result, matching how `messagesToWire` serializes
 * answered exercise results. */
export function extractLastTopicFromWire(messages: WireMessage[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "tool") {
      const result = msg.result as { topic?: string } | undefined;
      if (result?.topic) return result.topic;
    }
  }
  return undefined;
}

/** Wire-shape counterpart to `lastUserVoiceMetadata`. */
export function lastUserVoiceMetadataFromWire(messages: WireMessage[]): VoiceMetadata | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "user") return msg.voice;
  }
  return undefined;
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
    if (m.role === "user") return { role: "user", content: m.content, ...(m.voice ? { voice: m.voice } : {}) };
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
