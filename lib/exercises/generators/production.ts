import type {
  SpokenProductionExercise,
  WrittenProductionExercise,
} from '@/lib/exercises/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { normalizeCEFR } from '@/lib/exercises/cefr'
import {
  assessWordBankEntry,
  type EligibilityReason,
} from '@/lib/exercises/eligibility'
import type { GenerationResult, SkippedEntry } from '@/lib/exercises/generation'
import { exerciseId, pick } from '@/lib/exercises/utils'
import { selectConstraints } from '@/lib/exercises/speech-constraints'

/**
 * Free production exercises are online-only (AI grading via /api/gemini/grade-production).
 * Precedent: /practice/sounds — no Dexie layer until the model stabilizes.
 */

const WRITTEN_PROMPTS = [
  (word: string) => `Use "${word}" in an original sentence.`,
  (word: string) => `Write a sentence that shows you understand "${word}".`,
  (word: string) => `Make your own sentence with the word "${word}".`,
] as const

function promptIndex(entryId: string, modulo: number): number {
  let hash = 0
  for (let i = 0; i < entryId.length; i++) {
    hash = (hash * 31 + entryId.charCodeAt(i)) >>> 0
  }
  return hash % modulo
}

function toSkipped(entry: WordBankEntry, reasons: EligibilityReason[]): SkippedEntry {
  return { entryId: entry.id, text: entry.text, reasons }
}

function baseFields(entry: WordBankEntry) {
  return {
    sourceRef: {
      source: entry.source === 'core1k' ? ('core1k' as const) : ('word_bank' as const),
      id: entry.id,
    },
    level: entry.difficulty ? normalizeCEFR(entry.difficulty) : undefined,
    targetItem: entry.text,
    targetMeaning: entry.meaning ?? undefined,
    targetIpa: entry.ipa ?? undefined,
    exampleSentence: entry.example ?? undefined,
  }
}

export function generateWrittenProductionFromWordBank(
  entries: WordBankEntry[],
  count: number,
): GenerationResult<WrittenProductionExercise> {
  const skipped: SkippedEntry[] = []
  const usable = entries.filter((entry) => {
    const { eligible } = assessWordBankEntry(entry, 'written_production')
    return eligible
  })

  const exercises: WrittenProductionExercise[] = []

  for (const entry of pick(usable, count)) {
    const assessment = assessWordBankEntry(entry, 'written_production')
    if (!assessment.eligible) {
      skipped.push(toSkipped(entry, assessment.reasons))
      continue
    }

    const idx = promptIndex(entry.id, WRITTEN_PROMPTS.length)
    exercises.push({
      id: exerciseId('written_production', entry.id, entry.text),
      type: 'written_production',
      exerciseType: { domain: 'vocabulary', mode: 'write', variant: 'sentence' },
      taskPrompt: WRITTEN_PROMPTS[idx](entry.text),
      ...baseFields(entry),
    })
  }

  return { exercises, skipped }
}

export function generateSpokenProductionFromWordBank(
  entries: WordBankEntry[],
  count: number,
  preferredConstraintIds: readonly string[] = [],
): GenerationResult<SpokenProductionExercise> {
  const skipped: SkippedEntry[] = []
  const usable = entries.filter((entry) => {
    const { eligible } = assessWordBankEntry(entry, 'spoken_production')
    return eligible
  })

  if (usable.length === 0) {
    return { exercises: [], skipped }
  }

  const exercises: SpokenProductionExercise[] = []

  // Seed from the full eligible pool so a session is stable but different day to day.
  const seed = usable.map((e) => e.id).join('|')
  const constraints = selectConstraints(seed, count, preferredConstraintIds)

  // The pool feeding this generator is capped upstream (WORD_REVIEW_WORD_COUNT),
  // so reaching the session volume target requires repeating words — each
  // repeat paired with a different constraint. Cycle both lists independently
  // so word/constraint pairings stagger instead of colliding in lockstep.
  for (let i = 0; i < count; i++) {
    const entry = usable[i % usable.length]!
    const constraint = constraints[i % constraints.length]!

    exercises.push({
      id: exerciseId('spoken_production', entry.id, constraint.id),
      type: 'spoken_production',
      exerciseType: { domain: 'vocabulary', mode: 'speak', variant: 'sentence' },
      taskPrompt: constraint.promptEs(entry.text),
      constraint,
      ...baseFields(entry),
    })
  }

  return { exercises, skipped }
}
