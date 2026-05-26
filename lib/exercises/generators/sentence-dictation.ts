import type { SentenceDictationExercise } from '@/lib/exercises/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { normalizeCEFR } from '@/lib/exercises/cefr'
import { exerciseId, pick } from '@/lib/exercises/utils'

/**
 * Generate sentence dictation exercises from word bank entries.
 * Entries without an example sentence are discarded.
 */
export function generateSentenceDictationFromWordBank(
  entries: WordBankEntry[],
  count: number
): SentenceDictationExercise[] {
  const usable = entries.filter(e => Boolean(e.example))

  return pick(usable, count).map(entry => ({
    id: exerciseId('sentence_dictation', entry.id, entry.example!),
    type: 'sentence_dictation',
    exerciseType: { domain: 'vocabulary', mode: 'sentence_dictation' },
    sourceRef: { source: 'word_bank', id: entry.id },
    level: entry.difficulty ? normalizeCEFR(entry.difficulty) : undefined,
    sentence: entry.example!,
    audioUrl: entry.audio_url ?? null,
  }))
}
