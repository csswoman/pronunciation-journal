export type VocabBucket = 'nuevas' | 'aprendiendo' | 'en_repaso' | 'dominadas'

export type SkillStatusLike = 'unseen' | 'learning' | 'provisional' | 'review'

export function classifyTouchedWord(args: {
  meaningStatus: SkillStatusLike | null
  vaultStatus?: 'active' | 'snoozed' | 'mastered'
  mature?: boolean
  /** Legacy FSRS card state when skill status is unavailable */
  legacyState?: 'New' | 'Learning' | 'Review' | 'Relearning' | number
}): VocabBucket {
  if (args.vaultStatus === 'mastered' || args.mature === true) return 'dominadas'

  if (args.meaningStatus === 'review') return 'en_repaso'
  if (args.meaningStatus === 'learning' || args.meaningStatus === 'provisional') {
    return 'aprendiendo'
  }
  if (args.meaningStatus === 'unseen') return 'nuevas'

  const legacy = args.legacyState
  if (legacy === 'Review' || legacy === 2) return 'en_repaso'
  if (legacy === 'Learning' || legacy === 'Relearning' || legacy === 1 || legacy === 3) {
    return 'aprendiendo'
  }
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
