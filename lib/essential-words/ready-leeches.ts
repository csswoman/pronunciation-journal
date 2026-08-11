export const LEECH_LAPSE_THRESHOLD = 3

export interface LeechWord {
  wordId: string
  word: string
  lapses: number
}

/** Roll up by wordId using max lapses; keep words at or above threshold. */
export function collectLeeches(
  items: { wordId: string; word: string; lapses: number }[],
  threshold = LEECH_LAPSE_THRESHOLD,
): LeechWord[] {
  const byWord = new Map<string, LeechWord>()
  for (const item of items) {
    const prev = byWord.get(item.wordId)
    if (!prev || item.lapses > prev.lapses) {
      byWord.set(item.wordId, {
        wordId: item.wordId,
        word: item.word,
        lapses: item.lapses,
      })
    }
  }
  return Array.from(byWord.values())
    .filter((row) => row.lapses >= threshold)
    .sort((a, b) => b.lapses - a.lapses || a.word.localeCompare(b.word))
}
