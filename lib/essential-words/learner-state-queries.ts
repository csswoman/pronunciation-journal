import { db, type EssentialWordLearnerSignalRecord } from "@/lib/db";

function signalId(userId: string, wordId: string): string {
  return `${userId}:${wordId}`;
}

export async function getEssentialWordLearnerSignal(
  userId: string,
  wordId: string,
): Promise<EssentialWordLearnerSignalRecord | undefined> {
  return db.essentialWordLearnerSignals.get(signalId(userId, wordId));
}

async function updateSignal(
  userId: string,
  wordId: string,
  patch: Pick<EssentialWordLearnerSignalRecord, "familiarity" | "declaredKnownAt">
    | Pick<EssentialWordLearnerSignalRecord, "pronunciationDifficulty" | "pronunciationDifficultyAt">,
  now = new Date().toISOString(),
): Promise<EssentialWordLearnerSignalRecord> {
  const id = signalId(userId, wordId);
  const existing = await db.essentialWordLearnerSignals.get(id);
  const next: EssentialWordLearnerSignalRecord = {
    id,
    userId,
    wordId,
    familiarity: existing?.familiarity ?? "unknown",
    pronunciationDifficulty: existing?.pronunciationDifficulty ?? "none",
    ...existing,
    ...patch,
    updatedAt: now,
  };
  await db.essentialWordLearnerSignals.put(next);
  return next;
}

/** Records a claim for later verification; it never changes skill evidence. */
export function declareEssentialWordKnown(userId: string, wordId: string, now?: string) {
  const occurredAt = now ?? new Date().toISOString();
  return updateSignal(userId, wordId, {
    familiarity: "self-declared",
    declaredKnownAt: occurredAt,
  }, occurredAt);
}

/** Records a pronunciation-only need without changing meaning/listening/use. */
export function reportEssentialWordPronunciationDifficulty(userId: string, wordId: string, now?: string) {
  const occurredAt = now ?? new Date().toISOString();
  return updateSignal(userId, wordId, {
    pronunciationDifficulty: "self-reported",
    pronunciationDifficultyAt: occurredAt,
  }, occurredAt);
}
