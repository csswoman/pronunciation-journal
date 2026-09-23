export type SeedWord = { text: string; translation: string; ipa: string; example: string }
export type GrammarNote = {
  topic_id: string
  rule: string
  example_correct: string
  example_wrong: string
}
export type ResolvedSeedWord = SeedWord & {
  id?: string
  inWordBank: boolean
  srsStatus: string | null
  provenance: 'scaffold' | 'dueReview'
}
export type DueReviewSeedWord = SeedWord & {
  id: string
  inWordBank: true
  srsStatus: string
  provenance: 'dueReview'
}
export type SelectedGrammarNote = { topicId: string; rule: string; exampleCorrect: string; exampleWrong: string; dueState: 'due' | 'scheduled' | 'unseen'; nextReviewAt: string | null }

const normalize = (value: string) => value.trim().toLowerCase()

export function combineScaffoldVocabulary(
  scaffoldWords: ResolvedSeedWord[],
  dueWords: DueReviewSeedWord[],
  limit = 3,
): ResolvedSeedWord[] {
  const combined = [...scaffoldWords]
  const seenLemmas = new Set(scaffoldWords.map(({ text }) => normalize(text)))
  const seenIds = new Set(scaffoldWords.flatMap(({ id }) => id ? [id] : []))

  for (const word of dueWords) {
    if (seenIds.has(word.id) || seenLemmas.has(normalize(word.text))) {
      const matchIndex = combined.findIndex((candidate) =>
        candidate.id === word.id || normalize(candidate.text) === normalize(word.text),
      )
      if (matchIndex >= 0) {
        const existing = combined[matchIndex]
        combined[matchIndex] = {
          ...existing,
          translation: existing.translation || word.translation,
          ipa: existing.ipa || word.ipa,
          example: existing.example || word.example,
          id: word.id,
          inWordBank: true,
          srsStatus: word.srsStatus,
          provenance: 'dueReview',
        }
      }
      continue
    }

    combined.push(word)
    seenLemmas.add(normalize(word.text))
    seenIds.add(word.id)
    if (combined.filter((candidate) => candidate.provenance === 'dueReview').length >= limit) break
  }

  return combined
}
