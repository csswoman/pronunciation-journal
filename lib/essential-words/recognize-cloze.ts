import { clozeFor } from './cloze'
import { isFunctionalWordClass } from './word-classes'
import type { EssentialWord } from './types'

type ClozeConstraint =
  | { kind: 'allowed'; words: readonly string[] }
  | { kind: 'ambiguous' }
  | { kind: 'unknown' }

const THIRD_SINGULAR = ['he', 'she', 'it'] as const
const PLURAL_SUBJECT = ['you', 'we', 'they'] as const
const MODALS = [
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
] as const

function firstTokenAfterBlank(blanked: string): string {
  const after = blanked.split('___')[1]?.trim().toLowerCase() ?? ''
  return after.match(/^([\w']+)/)?.[1] ?? ''
}

function textBeforeBlank(blanked: string): string {
  return blanked.split('___')[0]?.trim().toLowerCase() ?? ''
}

/**
 * Syntactic slot after the blank. Returns `ambiguous` when several subjects
 * fit (e.g. "___ can …"), `unknown` when we cannot verify uniqueness, or a
 * finite allow-list when agreement is tight (e.g. "___ am").
 */
export function syntacticClozeConstraint(blanked: string): ClozeConstraint {
  const token = firstTokenAfterBlank(blanked)

  if (token === 'am' || token === "'m") return { kind: 'allowed', words: ['i'] }
  if (token === 'is' || token === 'was' || token === 'has' || token === 'does') {
    return { kind: 'allowed', words: THIRD_SINGULAR }
  }
  if (token === 'are' || token === 'were' || token === 'have' || token === 'do') {
    return { kind: 'allowed', words: PLURAL_SUBJECT }
  }
  if (MODALS.includes(token as (typeof MODALS)[number])) {
    return { kind: 'ambiguous' }
  }

  const before = textBeforeBlank(blanked)
  if (MODALS.some((modal) => new RegExp(`\\b${modal}\\s*$`).test(before))) {
    return { kind: 'ambiguous' }
  }
  if (/\b(do|does|did)\s*$/.test(before)) {
    return { kind: 'ambiguous' }
  }

  return { kind: 'unknown' }
}

function sentenceVariants(entry: EssentialWord): string[] {
  return [
    entry.example_sentence,
    ...(entry.example_sentences ?? []).map((variant) => variant.sentence),
  ]
}

/** True when a functional word has a cloze sentence worth trying at render time. */
export function hasRecognizeClozeCandidate(entry: EssentialWord): boolean {
  if (!isFunctionalWordClass(entry.pos)) return false
  return sentenceVariants(entry).some((sentence) => {
    const cloze = clozeFor(entry, sentence)
    if (!cloze) return false
    const constraint = syntacticClozeConstraint(cloze.blanked)
    return constraint.kind === 'allowed'
  })
}

/**
 * True only when the target is the sole valid option among the target plus the
 * distractors that will appear on the card.
 */
export function isDiscriminatingRecognizeCloze(
  entry: EssentialWord,
  sentence: string,
  distractors: EssentialWord[],
): boolean {
  const cloze = clozeFor(entry, sentence)
  if (!cloze) return false

  const constraint = syntacticClozeConstraint(cloze.blanked)
  if (constraint.kind !== 'allowed') return false

  const allowed = new Set(constraint.words.map((word) => word.toLowerCase()))
  const pool = [entry.word, ...distractors.map((d) => d.word)]
  const fitting = pool.filter((word) => allowed.has(word.toLowerCase()))
  const target = entry.word.toLowerCase()

  return fitting.length === 1 && fitting[0].toLowerCase() === target
}
