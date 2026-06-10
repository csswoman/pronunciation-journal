import type { FillBlankExercise } from '@/lib/exercises/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { CEFRLevel } from '@/lib/exercises/cefr'
import { normalizeCEFR } from '@/lib/exercises/cefr'
import { exerciseId, blankWord, pick, shuffle } from '@/lib/exercises/utils'

const DISTRACTOR_COUNT = 3

/**
 * Generate fill-in-the-blank exercises from word bank entries.
 * Entries without an example sentence containing the word are discarded.
 */
export function generateFillBlankFromWordBank(
  entries: WordBankEntry[],
  count: number
): FillBlankExercise[] {
  const usable = entries.filter(e => {
    if (!e.example || !e.text) return false
    return blankWord(e.example, e.text) !== null
  })

  const exercises: FillBlankExercise[] = pick(usable, count).map(entry => {
    const sentence = blankWord(entry.example!, entry.text)!
    const level = entry.difficulty ? normalizeCEFR(entry.difficulty) : undefined
    const options = buildOptions(entry, usable, level)

    const firstLetter = entry.text.charAt(0).toUpperCase()
    const hints = {
      level1: `Starts with "${firstLetter}"`,
      level2: entry.meaning ?? `The word is: ${entry.text}`,
      level3: entry.translation ?? undefined,
    }

    return {
      id: exerciseId('fill_blank', entry.id, entry.text),
      type: 'fill_blank',
      exerciseType: { domain: 'vocabulary', mode: 'fill_blank', variant: 'sentence' },
      sourceRef: { source: 'word_bank', id: entry.id },
      level,
      sentence,
      answer: entry.text,
      options,
      hint: entry.meaning ?? undefined,
      hints,
    }
  })

  return exercises
}

function buildOptions(
  entry: WordBankEntry,
  pool: WordBankEntry[],
  level: CEFRLevel | undefined
): string[] {
  const answer = entry.text

  // Prefer same CEFR level; fall back to any level.
  const sameCefr = pool.filter(
    e => e.id !== entry.id && e.text !== answer && normalizeCEFR(e.difficulty ?? 'B1') === level
  )
  const fallback = pool.filter(e => e.id !== entry.id && e.text !== answer)

  const candidates = sameCefr.length >= DISTRACTOR_COUNT ? sameCefr : fallback
  const distractors = pick(candidates, DISTRACTOR_COUNT).map(e => e.text)

  // Pad with unique placeholders if pool is too small (shouldn't happen in practice).
  while (distractors.length < DISTRACTOR_COUNT) {
    distractors.push(`option${distractors.length + 1}`)
  }

  return shuffle([answer, ...distractors])
}
