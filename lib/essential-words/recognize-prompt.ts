import { clozeFor } from './cloze'
import { isDiscriminatingRecognizeCloze } from './recognize-cloze'
import { selectSentence } from './sentence-variants'
import type { EssentialWordMode } from './exercise-modes'
import { isFunctionalWordClass } from './word-classes'
import type { EssentialWord } from './types'

export type RecognizePromptVariant = 'translation' | 'cloze'

export interface RecognizePrompt {
  instruction: string
  prompt: string
  variant: RecognizePromptVariant
}

function clozeInstruction(entry: EssentialWord): string {
  if (entry.pos === 'pronoun') return 'Elige el pronombre que completa la oración'
  return 'Elige la palabra que completa la oración'
}

type GlossField = 'translation' | 'meaning'

function normalizeGloss(text: string): string {
  return text.trim().toLowerCase()
}

/** True when only the target shares this gloss among the card's option pool. */
export function isDiscriminatingGloss(
  entry: EssentialWord,
  distractors: EssentialWord[],
  field: GlossField,
): boolean {
  const gloss = entry[field]?.trim()
  if (!gloss) return false

  const normalized = normalizeGloss(gloss)
  const pool = [entry, ...distractors]
  const matches = pool.filter((candidate) => {
    const candidateGloss = candidate[field]?.trim()
    return candidateGloss && normalizeGloss(candidateGloss) === normalized
  })
  return matches.length === 1
}

function glossPrompt(
  entry: EssentialWord,
  distractors: EssentialWord[],
  field: GlossField,
): RecognizePrompt | null {
  if (!isDiscriminatingGloss(entry, distractors, field)) return null
  const gloss = entry[field]?.trim()
  if (!gloss) return null

  return {
    instruction: 'Elige la palabra que significa esto',
    prompt: gloss,
    variant: 'translation',
  }
}

function translationPrompt(
  entry: EssentialWord,
  distractors: EssentialWord[],
): RecognizePrompt | null {
  return glossPrompt(entry, distractors, 'translation')
    ?? glossPrompt(entry, distractors, 'meaning')
}

function clozePrompt(
  entry: EssentialWord,
  distractors: EssentialWord[],
  repetitions: number,
): RecognizePrompt | null {
  if (!isFunctionalWordClass(entry.pos)) return null

  const { sentence } = selectSentence(entry, repetitions)
  const cloze = clozeFor(entry, sentence)
  if (!cloze || !isDiscriminatingRecognizeCloze(entry, sentence, distractors)) {
    return null
  }

  return {
    instruction: clozeInstruction(entry),
    prompt: cloze.blanked,
    variant: 'cloze',
  }
}

/**
 * Builds the recognition prompt for the selected mode. Cloze and gloss prompts
 * are validated against the actual distractors on the card so no option pool
 * admits two correct answers.
 */
export function recognizePromptFor(
  entry: EssentialWord,
  distractors: EssentialWord[],
  repetitions = 0,
  mode?: EssentialWordMode,
): RecognizePrompt | null {
  if (mode === 'recognize_meaning') {
    return glossPrompt(entry, distractors, 'meaning')
  }

  if (mode === 'recognize_translation') {
    return translationPrompt(entry, distractors)
  }

  if (mode === 'recognize_cloze') {
    return clozePrompt(entry, distractors, repetitions)
      ?? translationPrompt(entry, distractors)
  }

  // Legacy / tests: functional words try cloze first, then gloss.
  return clozePrompt(entry, distractors, repetitions)
    ?? translationPrompt(entry, distractors)
}
