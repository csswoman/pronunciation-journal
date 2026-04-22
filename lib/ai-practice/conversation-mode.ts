"use client";

import { db } from "@/lib/db";
import type { AIConversation, AIConversationMode } from "@/lib/types";

function getOrCreateDeviceId(): string {
  const key = "ai_practice_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

/** Returns the most recent conversation for a given mode, or null if none. */
export async function getActiveConversationForMode(
  mode: AIConversationMode
): Promise<AIConversation | null> {
  const conv = await db.aiConversations
    .where("mode")
    .equals(mode)
    .reverse()
    .first();
  return conv ?? null;
}

/**
 * Switch to a mode: resume the last conversation for that mode, or create a
 * blank one. Returns the conversation and its deserialized messages.
 */
export async function switchMode(mode: AIConversationMode): Promise<{
  conversationId: number;
  conversation: AIConversation;
}> {
  const existing = await getActiveConversationForMode(mode);
  if (existing?.id != null) {
    return { conversationId: existing.id, conversation: existing };
  }

  const now = new Date().toISOString();
  const blank: Omit<AIConversation, "id"> = {
    templateId: "free-conversation",
    mode,
    title: "",
    messages: [],
    deviceId: getOrCreateDeviceId(),
    createdAt: now,
    updatedAt: now,
  };
  const id = await db.aiConversations.add(blank as AIConversation);
  return { conversationId: id, conversation: { ...blank, id } };
}

/** Human-readable label for a mode (used in sidebar). */
export function modeLabel(mode: AIConversationMode): string {
  if (mode === "chat") return "Chat";
  if (mode === "pronunciation") return "Pronunciation";
  if (mode === "lesson") return "Lesson";
  if (mode.startsWith("roleplay:")) {
    const scenario = mode.slice("roleplay:".length);
    return `Roleplay · ${scenario.charAt(0).toUpperCase() + scenario.slice(1)}`;
  }
  return mode;
}
