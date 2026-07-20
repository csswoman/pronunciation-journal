import { db } from ".";
import type { AIConversation, AISavedWord } from "../types";

// ── Conversation Helpers ──

export async function saveConversation(
  userId: string,
  conv: Omit<AIConversation, "id" | "userId">
): Promise<number> {
  return db.aiConversations.add({ ...conv, userId } as AIConversation);
}

export async function updateConversation(
  userId: string,
  id: number,
  patch: Partial<AIConversation>
): Promise<void> {
  const row = await db.aiConversations.get(id);
  if (!row || row.userId !== userId) return;
  await db.aiConversations.update(id, { ...patch, userId });
}

export async function getRecentConversations(userId: string, limit = 20): Promise<AIConversation[]> {
  return db.aiConversations
    .where("userId")
    .equals(userId)
    .sortBy("updatedAt")
    .then((rows) => rows.reverse().slice(0, limit));
}

export async function deleteConversation(userId: string, id: number): Promise<void> {
  const row = await db.aiConversations.get(id);
  if (row?.userId === userId) await db.aiConversations.delete(id);
}

// ── Saved Word Helpers ──

export async function saveAIWord(
  userId: string,
  word: Omit<AISavedWord, "id" | "userId">
): Promise<number> {
  return db.aiWords.add({ ...word, userId } as AISavedWord);
}

export async function getAIWords(userId: string, limit = 100): Promise<AISavedWord[]> {
  return db.aiWords
    .where("userId")
    .equals(userId)
    .sortBy("savedAt")
    .then((rows) => rows.reverse().slice(0, limit));
}

export async function deleteAIWord(userId: string, id: number): Promise<void> {
  const row = await db.aiWords.get(id);
  if (row?.userId === userId) await db.aiWords.delete(id);
}
