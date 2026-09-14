import type { LearningChunk } from './types'

export interface PronunciationChunkRoute {
  wordId: string
  chunks: LearningChunk[]
  pronunciationTargetIds: string[]
}

/** The daily Essential Word adapter retains `core1k:` for legacy generic
 * exercises; authored content and durable Essential Word state use `c1k:`. */
function comparableEssentialWordId(wordId: string): string {
  return wordId.startsWith('core1k:') ? `c1k:${wordId.slice('core1k:'.length)}` : wordId
}

/**
 * Routes a learner-reported difficult word only through authored graph links.
 * It never guesses an IPA target from spelling or attributes meaning/use data.
 */
export function routePronunciationDifficulty(
  wordId: string,
  chunks: readonly LearningChunk[],
): PronunciationChunkRoute | null {
  const comparableWordId = comparableEssentialWordId(wordId)
  const matches = chunks.filter((chunk) => chunk.contentGraph.anchors
    .some((anchor) => anchor.id === comparableWordId))
  if (matches.length === 0) return null
  return {
    wordId,
    chunks: matches,
    pronunciationTargetIds: [...new Set(matches.flatMap((chunk) => chunk.contentGraph.pronunciationTargetIds))],
  }
}
