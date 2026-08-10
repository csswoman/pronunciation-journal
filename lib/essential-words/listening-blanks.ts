import type { ResolvedSentence } from './sentence-variants'
import type { SentenceToken } from './types'

export const SPANISH_COLD_START_CONTRASTS = ['/ɪ/|/iː/', '/b/|/v/', '/æ/|/ʌ/', '/s/|/z/'] as const

export interface ListeningBlank {
  token: SentenceToken
  contrastId?: string
}

/**
 * Tier is global; this only decides which audited words to perforate. The
 * sentence itself is never assigned permanently to a tier.
 */
export function selectListeningBlanks(
  sentence: ResolvedSentence,
  tier: 1 | 2,
  focusContrastId?: string,
): ListeningBlank[] {
  const tokens = sentence.tokens ?? []
  const eligible = tokens.filter((token) => token.text.trim().length > 0)
  const focused = focusContrastId
    ? eligible.filter((token) => token.contrastIds.includes(focusContrastId))
    : []
  const ranked = [...focused, ...eligible.filter((token) => !focused.includes(token))]
    .sort((left, right) => {
      const role = Number(left.role === 'function') - Number(right.role === 'function')
      return role || left.start - right.start
    })
  const count = tier === 1 ? 1 : Math.min(3, Math.max(2, ranked.length >= 3 ? 3 : 2))
  return ranked.slice(0, count).map((token) => ({
    token,
    contrastId: focusContrastId && token.contrastIds.includes(focusContrastId)
      ? focusContrastId
      : token.contrastIds[0],
  }))
}
