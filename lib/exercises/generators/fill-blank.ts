import type { FillBlankExercise } from '@/lib/exercises/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { CEFRLevel } from '@/lib/exercises/cefr'
import { normalizeCEFR } from '@/lib/exercises/cefr'
import {
  assessWordBankEntry,
  blankLemma,
  DISTRACTOR_COUNT,
  type EligibilityReason,
} from '@/lib/exercises/eligibility'
import type { GenerationResult, SkippedEntry } from '@/lib/exercises/generation'
import { exerciseId, pick, shuffle } from '@/lib/exercises/utils'
import { VOCABULARY_TOPIC } from '@/lib/practice/topic-labels'

/**
 * Generate fill-in-the-blank exercises from word bank entries.
 * Entries without a usable example (lemma match + context + distractor pool) land in `skipped`.
 */
export function generateFillBlankFromWordBank(
  entries: WordBankEntry[],
  count: number,
): GenerationResult<FillBlankExercise> {
  const skipped: SkippedEntry[] = []
  const usable = entries.filter((entry) => {
    const assessment = assessWordBankEntry(entry, 'fill_blank')
    if (!assessment.eligible) return false
    return true
  })

  const exercises: FillBlankExercise[] = []

  for (const entry of pick(usable, count)) {
    const poolAssessment = assessWordBankEntry(entry, 'fill_blank', { pool: usable })
    if (!poolAssessment.eligible) {
      skipped.push(toSkipped(entry, poolAssessment.reasons))
      continue
    }

    const sentence = blankLemma(entry.example!, entry.text)
    if (!sentence) {
      skipped.push(toSkipped(entry, ['word_not_in_sentence']))
      continue
    }

    const level = entry.difficulty ? normalizeCEFR(entry.difficulty) : undefined
    const options = buildOptions(entry, usable, level)
    if (!options) {
      skipped.push(toSkipped(entry, ['insufficient_distractor_pool']))
      continue
    }

    const firstLetter = entry.text.charAt(0).toUpperCase()
    exercises.push({
      id: exerciseId('fill_blank', entry.id, entry.text),
      type: 'fill_blank',
      exerciseType: { domain: 'vocabulary', mode: 'fill_blank', variant: 'sentence' },
      sourceRef: { source: entry.source === 'core1k' ? 'core1k' : 'word_bank', id: entry.id },
      topic: VOCABULARY_TOPIC,
      level,
      sentence,
      answer: entry.text,
      options,
      hint: entry.meaning ?? undefined,
      hints: {
        level1: `Starts with "${firstLetter}"`,
        level2: entry.meaning ?? `The word is: ${entry.text}`,
        level3: entry.translation ?? undefined,
      },
    })
  }

  return { exercises, skipped }
}

function toSkipped(entry: WordBankEntry, reasons: EligibilityReason[]): SkippedEntry {
  return { entryId: entry.id, text: entry.text, reasons }
}

function buildOptions(
  entry: WordBankEntry,
  pool: WordBankEntry[],
  level: CEFRLevel | undefined,
): string[] | null {
  const answer = entry.text

  const sameCefr = pool.filter(
    (e) => e.id !== entry.id && e.text !== answer && normalizeCEFR(e.difficulty ?? 'B1') === level,
  )
  const fallback = pool.filter((e) => e.id !== entry.id && e.text !== answer)

  const candidates = sameCefr.length >= DISTRACTOR_COUNT ? sameCefr : fallback
  const distractors = pick(candidates, DISTRACTOR_COUNT).map((e) => e.text)

  if (distractors.length < DISTRACTOR_COUNT) return null

  return shuffle([answer, ...distractors])
}
