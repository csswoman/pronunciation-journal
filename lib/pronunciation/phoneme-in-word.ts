// lib/pronunciation/phoneme-in-word.ts
import type { PhonemeAlignment } from '@/lib/types'
import { ARPABET_TO_IPA } from './phonemes'
import { stripStressDigit } from './arpabet-vowels'

export type ExplanationSegment = { text: string; emphasis?: 'grapheme' | 'ipa' }

export interface PhonemeInWordExplanation {
  /** Sentence split into segments; the UI emphasises the marked ones. */
  segments: ExplanationSegment[]
  /** Same sentence as flat text — used for aria-label and tests. */
  plainEs: string
  /** "dijiste /s/ (sin voz)" | "ese sonido no se te oyó" | null */
  contrastEs: string | null
}

/** Bare IPA symbol (no slashes) for an alignment entry, or null. */
function ipaSymbol(a: Pick<PhonemeAlignment, 'phoneme' | 'ipa'>): string | null {
  if (a.ipa) return a.ipa
  const bare = stripStressDigit(a.phoneme ?? '').toUpperCase()
  return ARPABET_TO_IPA[bare] ?? null
}

/** Voicing note for the sound actually produced, when it clarifies the error. */
function voicingNote(gotIpa: string, targetIpa: string): string {
  const voiceless = new Set(['s', 'f', 'θ', 'p', 't', 'k', 'ʃ', 'tʃ'])
  const voiced = new Set(['z', 'v', 'ð', 'b', 'd', 'g', 'ʒ', 'dʒ'])
  if (voiceless.has(gotIpa) && voiced.has(targetIpa)) return ' (sin voz)'
  if (voiced.has(gotIpa) && voiceless.has(targetIpa)) return ' (con voz)'
  return ''
}

function buildContrast(culprit: PhonemeAlignment, targetIpa: string): string | null {
  if (culprit.status === 'missing') return 'ese sonido no se te oyó'
  const gotIpa = culprit.gotIpa ?? (culprit.got ? ipaSymbol({ phoneme: culprit.got }) : null)
  if (gotIpa && gotIpa !== targetIpa) {
    return `dijiste /${gotIpa}/${voicingNote(gotIpa, targetIpa)}`
  }
  return null
}

function flatten(segments: ExplanationSegment[]): string {
  return segments.map((s) => s.text).join('')
}

export function describePhonemeInWord(
  syllableText: string,
  culprit: PhonemeAlignment,
): PhonemeInWordExplanation | null {
  const targetIpa = ipaSymbol(culprit)
  if (!targetIpa) return null

  const contrastEs = buildContrast(culprit, targetIpa)

  // Pattern table wired in Task 2. For now: generic fallback only.
  const segments: ExplanationSegment[] = [
    { text: 'el sonido ' },
    { text: `/${targetIpa}/`, emphasis: 'ipa' },
    { text: ' en «' },
    { text: syllableText, emphasis: 'grapheme' },
    { text: '»' },
  ]

  return { segments, plainEs: flatten(segments), contrastEs }
}
