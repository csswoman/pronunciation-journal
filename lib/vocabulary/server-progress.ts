import { getAppVocabularyCatalogTotal } from "@/lib/vocabulary/catalog";
import { getVocabularyRetentionStats } from "@/lib/word-bank/server-queries";

export interface VocabularyProgressSeed {
  wordBankMastered: number;
  catalogTotal: number;
}

/** Server-known slice of app vocabulary progress (word bank mastered + catalog size). */
export async function getVocabularyProgressSeed(): Promise<VocabularyProgressSeed> {
  let wordBankMastered = 0;
  try {
    const stats = await getVocabularyRetentionStats();
    wordBankMastered = stats.mastered;
  } catch {
    wordBankMastered = 0;
  }

  return {
    wordBankMastered,
    catalogTotal: getAppVocabularyCatalogTotal(),
  };
}
