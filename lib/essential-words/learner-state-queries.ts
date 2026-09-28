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

export async function getEssentialWordLearnerSignals(
  userId?: string,
): Promise<EssentialWordLearnerSignalRecord[]> {
  if (!userId) return [];
  return db.essentialWordLearnerSignals.where("userId").equals(userId).toArray();
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

/** Undo one self-declared familiarity without removing other learner signals. */
export async function restoreEssentialWordKnownClaim(
  userId: string,
  wordId: string,
  previous: EssentialWordLearnerSignalRecord | undefined,
  declaredKnownAt: string,
): Promise<void> {
  const id = signalId(userId, wordId);
  await db.transaction("rw", db.essentialWordLearnerSignals, async () => {
    const current = await db.essentialWordLearnerSignals.get(id);
    if (!current || current.declaredKnownAt !== declaredKnownAt) {
      throw new Error("La declaración cambió y no se puede deshacer con seguridad.");
    }

    const restored: EssentialWordLearnerSignalRecord = {
      ...current,
      familiarity: previous?.familiarity ?? "unknown",
      declaredKnownAt: previous?.declaredKnownAt,
      updatedAt: new Date().toISOString(),
    };
    if (
      restored.familiarity === "unknown"
      && restored.pronunciationDifficulty === "none"
      && !restored.pronunciationLastRoutedAt
    ) {
      await db.essentialWordLearnerSignals.delete(id);
      return;
    }
    await db.essentialWordLearnerSignals.put(restored);
  });
}

/** Records a pronunciation-only need without changing meaning/listening/use. */
export function reportEssentialWordPronunciationDifficulty(userId: string, wordId: string, now?: string) {
  const occurredAt = now ?? new Date().toISOString();
  return updateSignal(userId, wordId, {
    pronunciationDifficulty: "self-reported",
    pronunciationDifficultyAt: occurredAt,
  }, occurredAt);
}
