import type { WordBankChangeEvent } from "@/lib/word-bank/change-events";
import type { WordBankEntry } from "@/lib/word-bank/types";

export function makePendingKey(text: string, context?: string | null): string {
  return `${text.trim().toLowerCase()}::${(context ?? "").trim().toLowerCase()}`;
}

/**
 * Applies a Realtime word_bank change to the current word list.
 * Mutates pendingAddRef and processingSinceRef when matching the hook behavior.
 */
export function applyWordBankChange(
  currentWords: WordBankEntry[],
  event: WordBankChangeEvent,
  pendingAddRef: Map<string, string>,
  processingSinceRef: Map<string, number>,
): WordBankEntry[] {
  if (event.type === "INSERT") {
    const next = event.new;
    const pendingKey = makePendingKey(next.text, next.context);
    const tempId = pendingAddRef.get(pendingKey);
    if (tempId) {
      pendingAddRef.delete(pendingKey);
      return currentWords.map((w) => (w.id === tempId ? next : w));
    }
    if (currentWords.some((w) => w.id === next.id)) return currentWords;
    return [next, ...currentWords];
  }

  if (event.type === "UPDATE") {
    const next = event.new;
    if (next.status !== "processing") {
      processingSinceRef.delete(next.id);
    }
    return currentWords.map((w) => (w.id === next.id ? next : w));
  }

  const old = event.old;
  processingSinceRef.delete(old.id);
  return currentWords.filter((w) => w.id !== old.id);
}
