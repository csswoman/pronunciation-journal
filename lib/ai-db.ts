import { db } from "./db";
import type { AIConversation, AISavedWord } from "./types";

// ── Conversation Helpers ──

export async function saveConversation(
  conv: Omit<AIConversation, "id">
): Promise<number> {
  return db.aiConversations.add(conv as AIConversation);
}

export async function updateConversation(
  id: number,
  patch: Partial<AIConversation>
): Promise<void> {
  await db.aiConversations.update(id, patch);
}

export async function getConversation(
  id: number
): Promise<AIConversation | undefined> {
  return db.aiConversations.get(id);
}

export async function getRecentConversations(limit = 20): Promise<AIConversation[]> {
  return db.aiConversations
    .orderBy("updatedAt")
    .reverse()
    .limit(limit)
    .toArray();
}

export async function deleteConversation(id: number): Promise<void> {
  await db.aiConversations.delete(id);
}

// ── Saved Word Helpers ──

export async function saveAIWord(
  word: Omit<AISavedWord, "id">
): Promise<number> {
  return db.aiWords.add(word as AISavedWord);
}

export async function getAIWords(limit = 100): Promise<AISavedWord[]> {
  return db.aiWords
    .orderBy("savedAt")
    .reverse()
    .limit(limit)
    .toArray();
}

export async function deleteAIWord(id: number): Promise<void> {
  await db.aiWords.delete(id);
}

export async function isAIWordSaved(word: string): Promise<boolean> {
  const count = await db.aiWords
    .where("word")
    .equalsIgnoreCase(word.trim())
    .count();
  return count > 0;
}
