import type {
  SpokenProductionExercise,
  WrittenProductionExercise,
} from '@/lib/exercises/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { normalizeCEFR, type CEFRLevel } from '@/lib/exercises/cefr'
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

/**
 * True when a word has no real difficulty rating: `entry.difficulty` is `0`
 * (the Supabase insert default for words the user saved via the dictionary
 * lookup, AI Coach, or a domain lexicon — never curated seed vocabulary) or
 * missing entirely. Free production forces the model to combine this word
 * with a grammar constraint in an original sentence, so a word with no
 * vetted level is a real risk at A1/A2: a technical or niche term (e.g. a
 * programming-glossary word saved out of curiosity) can slip in and produce
 * an unanswerable prompt — "how often do you use 'declarative'?" — that a
 * beginner has no way to interpret as their own failure to solve.
 * Higher levels keep the word: the same prompt is merely odd, not blocking.
 */
function hasUnvettedDifficulty(entry: WordBankEntry): boolean {
  return !entry.difficulty
}

/**
 * Free production is unsafe for words with no vetted CEFR level at A1/A2 —
 * see hasUnvettedDifficulty. An UNKNOWN learner level is treated the same as
 * A1/A2, not as "no restriction": `cefrEstimate` defaults to B1 as soon as
 * `learningState` is persisted, so `undefined` here almost never means "an
 * established intermediate/advanced learner" — it means the very first
 * session, before that state exists yet. That is exactly the moment an
 * unanswerable prompt does the most damage (first impression), so silence on
 * level must not be read as permission.
 */
function isSafeForFreeProduction(entry: WordBankEntry, learnerLevel?: CEFRLevel): boolean {
  if (learnerLevel && learnerLevel !== 'A1' && learnerLevel !== 'A2') return true
  return !hasUnvettedDifficulty(entry)
}

function baseFields(entry: WordBankEntry, learnerLevel?: CEFRLevel) {
  return {
    sourceRef: {
      source: entry.source === 'core1k' ? ('core1k' as const) : ('word_bank' as const),
      id: entry.id,
    },
    // El nivel del alumno manda sobre la dificultad SRS de la palabra: sin él,
    // el corrector cae en su default "A2–B2" y juzga a un A1 con vara alta.
    level: learnerLevel ?? (entry.difficulty ? normalizeCEFR(entry.difficulty) : undefined),
    targetItem: entry.text,
    targetMeaning: entry.meaning ?? undefined,
    targetIpa: entry.ipa ?? undefined,
    exampleSentence: entry.example ?? undefined,
  }
}

export function generateWrittenProductionFromWordBank(
  entries: WordBankEntry[],
  count: number,
  level?: CEFRLevel,
): GenerationResult<WrittenProductionExercise> {
  const skipped: SkippedEntry[] = []
  const usable = entries.filter((entry) => {
    const { eligible } = assessWordBankEntry(entry, 'written_production')
    return eligible && isSafeForFreeProduction(entry, level)
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
      ...baseFields(entry, level),
    })
  }

  return { exercises, skipped }
}

export function generateSpokenProductionFromWordBank(
  entries: WordBankEntry[],
  count: number,
  preferredConstraintIds: readonly string[] = [],
  level?: CEFRLevel,
): GenerationResult<SpokenProductionExercise> {
  // Always empty: eligibility is pre-filtered into `usable` above and this
  // mode has no pool-dependent branch in assessWordBankEntry, so nothing
  // can newly fail once an entry has passed. Kept for GenerationResult shape
  // parity with the other generators — revisit if eligibility ever depends
  // on the chosen pool for this mode.
  const skipped: SkippedEntry[] = []
  const usable = entries.filter((entry) => {
    const { eligible } = assessWordBankEntry(entry, 'spoken_production')
    return eligible && isSafeForFreeProduction(entry, level)
  })

  if (usable.length === 0) {
    return { exercises: [], skipped }
  }

  const exercises: SpokenProductionExercise[] = []

  // Seed from the full eligible pool so a session is stable but different day to day.
  const seed = usable.map((e) => e.id).join('|')
  const constraints = selectConstraints(seed, count, preferredConstraintIds, level)

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
      ...baseFields(entry, level),
    })
  }

  return { exercises, skipped }
}
