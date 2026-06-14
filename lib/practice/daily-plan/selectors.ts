import type { WordEntry } from '@/lib/lexicon/types'
import type { PracticeExercise } from '@/lib/practice/types'
import type { Sound } from '@/lib/phoneme-practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'

/** Día del año (1-366) usado para rotar la selección de contenido por día. */
export function dayOfYear(now = new Date()): number {
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000)
}

export function dedupeByContentId(exercises: PracticeExercise[]): PracticeExercise[] {
  const seen = new Set<string>()
  return exercises.filter((ex) => {
    if (seen.has(ex.contentId)) return false
    seen.add(ex.contentId)
    return true
  })
}

/**
 * Elige un sonido del seed de forma determinista por día, evitando el sonido
 * ya usado por el paso de fonema débil.
 */
export function pickSeedSound(allSounds: Sound[], offset: number, excludeId?: number): Sound | null {
  const pool = allSounds.filter((s) => s.id !== excludeId)
  if (pool.length === 0) return null
  const ranked = [...pool].sort((a, b) => (a.difficulty ?? 9) - (b.difficulty ?? 9))
  return ranked[(dayOfYear() + offset) % ranked.length]
}

/** Adapts WordBankEntry to the WordEntry shape expected by generateSentenceContextExercises. */
export function toWordEntry(entry: WordBankEntry): WordEntry {
  return {
    id: entry.id,
    word: entry.text,
    pos: 'n',
    definition: entry.meaning ?? '',
    ipa: entry.ipa ?? undefined,
    translation: entry.translation ?? undefined,
    difficulty: (entry.difficulty ?? 2) as 1 | 2 | 3,
    tags: [],
    exampleSentence: entry.example ?? undefined,
  }
}
