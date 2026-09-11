import type { StarterId } from "@/lib/ai-practice/starters/types";
export type ToolCallStatus = "pending" | "rendered" | "answered" | "error";

export type ToolCall = {
  id: string;
  name: string;
  args: unknown;
  status: ToolCallStatus;
  result?: ExerciseResult;
  error?: string;
  errorId?: string;
};

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "tool_call"; callId: string };

/** Voice metadata for a spoken chat turn. `scored` mirrors the honest
 * SpokenAttempt contract (`lib/pronunciation/spoken-attempt.ts`): true only
 * when STT actually captured and transcribed real speech. There is no fixed
 * target phrase in free chat, so "scored" here means a successful transcript
 * capture — not a pronunciation-accuracy grade. */
export type VoiceMetadata = { transcript: true; scored: boolean };

/** Options for one chat send. `starterId` marks an authored starter prompt. */
export type SendOpts = {
  hidden?: boolean;
  voice?: VoiceMetadata;
  starterId?: StarterId;
  /**
   * Short label rendered as a centered divider in place of a hidden message.
   * Only meaningful alongside `hidden` — it marks that an event happened
   * (an exercise finished) without faking a user bubble.
   */
  marker?: string;
};

export type AIMessage =
  | { role: "user"; content: string; timestamp: string; hidden?: boolean; voice?: VoiceMetadata; marker?: string }
  | { role: "model"; contentParts: ContentPart[]; toolCalls: Map<string, ToolCall>; timestamp: string; translation?: string }
  | { role: "tool"; toolCallId: string; name: string; result: unknown; timestamp: string };

export type StreamChunk =
  | { type: "text_delta"; delta: string }
  | { type: "tool_call_start"; id: string; name: string }
  | { type: "tool_call_args_delta"; id: string; delta: string }
  | { type: "tool_call_end"; id: string }
  | { type: "done"; truncated?: boolean }
  | { type: "error"; message: string };

export type StreamBuffer = {
  textParts: Array<{ insertIndex: number; text: string }>;
  toolCallsAccum: Map<string, { name: string; argsJson: string; insertIndex: number }>;
  partCount: number;
};

export type ExerciseResult = {
  correct: boolean;
  score?: number;
  topic: string;
  gradedBy: "client" | "model";
  latencyMs?: number;
  /** IPA symbol being practiced, if the exercise targets a specific phoneme. */
  ipa?: string;
};

// Serialization helpers for Dexie (Map is not JSON-serializable)
export type SerializedModelMessage = Omit<Extract<AIMessage, { role: "model" }>, "toolCalls"> & {
  toolCalls: Array<[string, ToolCall]>;
};

export function serializeMessage(msg: Extract<AIMessage, { role: "model" }>): SerializedModelMessage {
  return { ...msg, toolCalls: Array.from(msg.toolCalls.entries()) };
}

export function deserializeMessage(raw: SerializedModelMessage): Extract<AIMessage, { role: "model" }> {
  return { ...raw, toolCalls: new Map(raw.toolCalls) };
}

export function messageToText(msg: Extract<AIMessage, { role: "model" }>): string {
  return msg.contentParts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map(p => p.text)
    .join("\n")
    .trim();
}
