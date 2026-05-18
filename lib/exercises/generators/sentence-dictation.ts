import type { SentenceDictationExercise } from '@/lib/exercises/types'
import type { WordBankEntry } from '@/lib/types'
import type { TextFragment } from '@/lib/exercises/queries'
import { exerciseId } from '@/lib/exercises/utils'

/**
 * Generate sentence dictation exercises from text_fragments.
 * If audio_url is null the component falls back to TTS.
 */
export function generateDictationFromFragments(
  fragments: TextFragment[]
): SentenceDictationExercise[] {
  return fragments
    .filter(f => f.content?.trim())
    .map(f => ({
      id: exerciseId('sentence_dictation', f.id, 'fragment'),
      type: 'sentence_dictation' as const,
      sourceRef: { source: 'text_fragments' as const, id: f.id },
      sentence: f.content.trim(),
      audioUrl: f.audio_url,
    }))
}

/**
 * Generate single-word dictation exercises from word_bank entries.
 * Uses word.audio_url when available; falls back to TTS.
 */
export function generateDictationFromWordBank(
  words: WordBankEntry[]
): SentenceDictationExercise[] {
  return words
    .filter(w => w.status === 'ready' && w.text)
    .map(w => ({
      id: exerciseId('sentence_dictation', w.id, 'wordbank'),
      type: 'sentence_dictation' as const,
      sourceRef: { source: 'word_bank' as const, id: w.id },
      sentence: w.example ?? w.text,
      audioUrl: w.audio_url,
    }))
}
