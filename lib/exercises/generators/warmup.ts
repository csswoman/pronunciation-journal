import type { WordBankEntry } from '@/lib/word-bank/types'
import { exerciseId, pick } from '@/lib/exercises/utils'

/**
 * Warm-up shadowing phrase.
 *
 * Deliberately NOT a graded exercise type: it writes nothing to
 * answer_history and cannot be failed. Its only job is to get the learner
 * speaking before the first free production, which is where speaking anxiety
 * otherwise stops the session.
 */
export interface WarmupShadowPhrase {
  id: string
  phrase: string
  /** Always false — warm-ups are never scored. */
  scored: false
}

export function generateWarmupShadowPhrases(
  entries: WordBankEntry[],
  count: number,
): WarmupShadowPhrase[] {
  const usable = entries.filter(
    (e) => typeof e.example === 'string' && e.example.trim().length > 0,
  )
  return pick(usable, count).map((entry) => ({
    id: exerciseId('warmup_shadow', entry.id, entry.example ?? ''),
    phrase: entry.example!.trim(),
    scored: false as const,
  }))
}
