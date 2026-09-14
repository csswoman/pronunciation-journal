import { LEARNING_CHUNKS } from '@/lib/chunk-of-day/catalog'
import { getTarget } from '@/lib/pronunciation/targets/registry'
import type { SoundLabPhraseCandidate } from './recommended-phrase'

function targetIpas(targetId: string): string[] {
  const result = getTarget(targetId)
  if (!result.ok) return []
  if (result.target.contrastPair) return [...result.target.contrastPair]
  const prefix = 'segmental.phoneme.'
  return result.target.id.startsWith(prefix)
    ? [result.target.id.slice(prefix.length)]
    : []
}

/** Sends only the small authored pronunciation pilot across the server/client boundary. */
export function getSoundLabPhraseCandidates(): SoundLabPhraseCandidate[] {
  return LEARNING_CHUNKS.flatMap((chunk) => {
    const targetIpaList = [...new Set(
      chunk.contentGraph.pronunciationTargetIds.flatMap(targetIpas),
    )]
    if (targetIpaList.length === 0) return []
    return [{
      id: chunk.id,
      phrase: chunk.learning.practiceAnswer,
      ipa: chunk.ipa,
      meaning: chunk.meaning,
      targetIpas: targetIpaList,
    }]
  })
}
