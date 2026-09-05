import type { AIMessage } from "@/lib/ai-practice/types";

export function hasVisibleCoachMessages(messages: AIMessage[]): boolean {
  return messages.some((message) => {
    if (message.role === "tool") return false;
    if (message.role === "user" && message.hidden) return false;
    return true;
  });
}

/** Stay on the conversation surface so errors/quota are not swallowed by Home. */
export function shouldShowCoachTranscript(input: {
  messages: AIMessage[];
  isStreaming: boolean;
  error: string | null;
  quotaExhausted: boolean;
}): boolean {
  if (input.isStreaming || Boolean(input.error) || input.quotaExhausted) return true;
  return hasVisibleCoachMessages(input.messages);
}

export function dropTrailingModelPlaceholder(messages: AIMessage[]): AIMessage[] {
  const last = messages[messages.length - 1];
  if (last?.role === "model") return messages.slice(0, -1);
  return messages;
}
