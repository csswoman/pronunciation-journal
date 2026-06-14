import type { CoreWord, CefrLevel } from './types'
import type { WordBankEntry } from '@/lib/word-bank/types'

function cefrToDifficulty(level: CefrLevel): number {
  if (level === 'C1') return 3
  if (level === 'B1' || level === 'B2') return 2
  return 1 // A1, A2
}

export function coreWordToWordBankEntry(w: CoreWord): WordBankEntry {
  return {
    id: `core1k:${w.word.toLowerCase()}`,
    user_id: '',
    text: w.word,
    meaning: null,
    translation: null,
    example: w.example_sentence,
    ipa: w.ipa_strong,
    difficulty: cefrToDifficulty(w.cefr_level),
    srs_status: 'new',
    status: 'ready',
    audio_url: null,
    audio_fetch_attempts: 0,
    context: null,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    ease_factor: 2.5,
    error_reason: null,
    has_audio: null,
    image_prompt: null,
    interval_days: 0,
    last_reviewed_at: null,
    next_review_at: null,
    repetitions: 0,
    review_count: 0,
    source: 'core1k',
    source_ref: null,
    synonyms: null,
  }
}
