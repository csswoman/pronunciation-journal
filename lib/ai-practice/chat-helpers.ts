import type { AIMessage } from "@/lib/ai-practice/types";
import { deserializeMessage, serializeMessage, type SerializedModelMessage } from "@/lib/ai-practice/types";
import { saveConversation, updateConversation } from "@/lib/db/ai";
import { getInitialTitleForModeAndMessage, isSystemPromptText } from "@/lib/ai-practice/conversation-title";
import { logEvent } from "@/lib/ai-practice/events";
import type { AIConversationMode } from "@/lib/types";

export function getOrCreateDeviceId(): string {
  const key = "ai_practice_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

/**
 * Rehydrates persisted messages: model turns arrive with plain-object toolCalls
 * and must become `Map`s again; everything else passes through untouched.
 */
export function hydratePersistedMessages(msgs: AIMessage[]): AIMessage[] {
  return msgs.map((m) => {
    if (m.role !== "model") return m;
    const raw = m as unknown as SerializedModelMessage | Extract<AIMessage, { role: "model" }>;
    if (raw.toolCalls instanceof Map) return raw as Extract<AIMessage, { role: "model" }>;
    return deserializeMessage(raw as SerializedModelMessage);
  });
}

/** Serializes and writes a message-array edit to an existing conversation. */
export function persistMessageEdit(
  userId: string | null,
  conversationId: number | null,
  messages: AIMessage[],
): void {
  if (!userId || !conversationId) return;
  const serialized = messages.map((m) => (m.role === "model" ? serializeMessage(m) : m)) as never;
  void updateConversation(userId, conversationId, {
    messages: serialized,
    updatedAt: new Date().toISOString(),
  } as never);
}

export async function logFirstExerciseTimeIfNeeded(
  hasLogged: boolean,
  stateCalls: Map<string, { name: string }>,
  sessionStartAt: number,
  userId: string | null,
): Promise<boolean> {
  if (!hasLogged && stateCalls.size > 0) {
    const { isExerciseTool } = await import("@/lib/ai-practice/tools/registry");
    const hasExercise = [...stateCalls.values()].some((tc) => isExerciseTool(tc.name as never));
    if (hasExercise) {
      logEvent("time_to_first_exercise", { timeMs: Date.now() - sessionStartAt }, userId).catch(() => {});
      return true;
    }
  }
  return hasLogged;
}

export async function persistConversationState({
  userId,
  conversationId,
  mode,
  text,
  starterId,
  messages,
  onConversationCreated,
}: {
  userId: string | null;
  conversationId: number | null;
  mode: AIConversationMode;
  text: string;
  starterId?: string;
  messages: AIMessage[];
  onConversationCreated: (id: number) => void;
}): Promise<number | null> {
  if (!userId) return conversationId;
  const now = new Date().toISOString();
  const serialized = messages.map((m) => (m.role === "model" ? serializeMessage(m) : m)) as never;

  if (conversationId) {
    const patch: { messages: typeof serialized; updatedAt: string; title?: string } = {
      messages: serialized,
      updatedAt: now,
    };
    if (!mode.startsWith("mission:") && text && !isSystemPromptText(text)) {
      patch.title = text.trim().slice(0, 60);
    }
    await updateConversation(userId, conversationId, patch as never);
    return conversationId;
  }

  const title = getInitialTitleForModeAndMessage(mode, text, starterId);
  const id = await saveConversation(userId, {
    templateId: "free-conversation",
    mode,
    title,
    messages: serialized,
    deviceId: getOrCreateDeviceId(),
    createdAt: now,
    updatedAt: now,
  });
  onConversationCreated(id);
  return id;
}
