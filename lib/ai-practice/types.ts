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

export type AIMessage =
  | { role: "user"; content: string; timestamp: string }
  | { role: "model"; contentParts: ContentPart[]; toolCalls: Map<string, ToolCall>; timestamp: string }
  | { role: "tool"; toolCallId: string; name: string; result: unknown; timestamp: string };

export type StreamChunk =
  | { type: "text_delta"; delta: string }
  | { type: "tool_call_start"; id: string; name: string }
  | { type: "tool_call_args_delta"; id: string; delta: string }
  | { type: "tool_call_end"; id: string }
  | { type: "done" };

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
