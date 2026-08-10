export type VocabBucket = 'nuevas' | 'aprendiendo' | 'en_repaso' | 'dominadas'

export type SkillStatusLike = 'unseen' | 'learning' | 'provisional' | 'review'

export function classifyTouchedWord(args: {
  meaningStatus: SkillStatusLike | null
  vaultStatus?: 'active' | 'snoozed' | 'mastered'
  mature?: boolean
  /** FSRS CardState when skill status is unavailable: 0 New, 1 Learning, 2 Review, 3 Relearning */
  legacyState?: number
}): VocabBucket {
  if (args.vaultStatus === 'mastered' || args.mature === true) return 'dominadas'

  if (args.meaningStatus === 'review') return 'en_repaso'
  if (args.meaningStatus === 'learning' || args.meaningStatus === 'provisional') {
    return 'aprendiendo'
  }
  if (args.meaningStatus === 'unseen') return 'nuevas'

  if (args.legacyState === 2) return 'en_repaso'
  if (args.legacyState === 1 || args.legacyState === 3) return 'aprendiendo'
  return 'nuevas'
}

export function tallyVocabularyBuckets(
  words: { wordId: string; bucket: VocabBucket }[],
): Record<VocabBucket, number> {
  const tally: Record<VocabBucket, number> = {
    nuevas: 0,
    aprendiendo: 0,
    en_repaso: 0,
    dominadas: 0,
  }
  const seen = new Set<string>()
  for (const word of words) {
    if (seen.has(word.wordId)) continue
    seen.add(word.wordId)
    tally[word.bucket] += 1
  }
  return tally
}
