/** Merges server word-bank mastery with client Essential Words SRS (approximate; may overlap). */
export function mergeVocabularyLearned(
  wordBankMastered: number,
  essentialLearned: number,
  catalogTotal: number,
): { learned: number; percent: number } {
  const learned = Math.min(catalogTotal, wordBankMastered + essentialLearned);
  const percent = catalogTotal > 0 ? Math.round((learned / catalogTotal) * 100) : 0;
  return { learned, percent };
}
