// lib/pronunciation/feedback/word-feedback.ts
// Pure adapter: scored words → one diagnosis per word, ready for <WordFeedbackPanel>.
import type { WordResult } from '@/lib/types'
import type { SyllableResult } from '@/lib/pronunciation/syllable-scoring'
import { pickPrimaryFix } from '@/lib/pronunciation/pick-primary-fix'
import {
  describePhonemeInWord,
  type ExplanationSegment,
} from '@/lib/pronunciation/phoneme-in-word'
import { buildRemediation } from '@/lib/pronunciation/syllable-remediation'

/** bien · casi · mal (mint · butter · coral). */
export type WordFeedbackState = 'good' | 'almost' | 'bad'

export interface WordFix {
  /** IPA with slashes, e.g. "/aɪ/". */
  ipa: string
  /** Sentence about the failed sound; the UI emphasises marked segments. */
  diag: ExplanationSegment[]
  /** Same sentence as flat text (aria-label, tests). */
  diagPlain: string
  /** Memorable title of the "Cómo se hace" panel; null ⇒ the IPA symbol. */
  title: string | null
  steps: string[]
  tip: string | null
  minimalPairs: { wordA: string; wordB: string }[]
}

export interface WordFeedback {
  text: string
  state: WordFeedbackState
  /** Extra word the learner said that is not in the target phrase. */
  extra: boolean
  /** Failed-sound diagnosis; null for good words or when no sound is locatable. */
  fix: WordFix | null
  /** Fallback explanation when `fix` is null and the word still failed. */
  note: string | null
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function diagSegments(
  segments: ExplanationSegment[],
  contrastEs: string | null,
): ExplanationSegment[] {
  const [first, ...rest] = segments
  const out: ExplanationSegment[] = [{ ...first, text: capitalize(first.text) }, ...rest]
  out.push({ text: contrastEs ? `. ${capitalize(contrastEs)}.` : '.' })
  return out
}

function buildFailedWord(
  word: WordResult,
  text: string,
  syllableMap: Map<string, SyllableResult[]>,
): WordFeedback {
  const primary = pickPrimaryFix([word], syllableMap)
  const explanation = primary
    ? describePhonemeInWord(primary.syllableText, primary.culprit)
    : null

  if (!primary || !explanation) {
    return {
      text,
      state: 'almost',
      extra: false,
      fix: null,
      note: word.got
        ? `Sonó más como «${word.got}» que como «${text}».`
        : `Revisa cómo suena «${text}».`,
    }
  }

  const remediation = buildRemediation(primary.culprit)
  const segments = diagSegments(explanation.segments, explanation.contrastEs)

  return {
    text,
    // Sound absent altogether is "no se oyó"; a wrong sound is "casi".
    state: primary.culprit.status === 'missing' ? 'bad' : 'almost',
    extra: false,
    note: null,
    fix: {
      ipa: remediation?.ipa ?? `/${primary.culprit.ipa ?? ''}/`,
      diag: segments,
      diagPlain: segments.map((s) => s.text).join(''),
      title: remediation?.hookEs ?? null,
      steps: remediation?.articulationEs ?? [],
      tip: remediation?.spanishTip ?? null,
      minimalPairs: remediation?.minimalPairs ?? [],
    },
  }
}

export function buildWordFeedback(
  wordResults: WordResult[],
  syllableMap: Map<string, SyllableResult[]>,
): WordFeedback[] {
  return wordResults.map((word) => {
    const text = word.expected || word.got
    switch (word.status) {
      case 'correct':
        return { text, state: 'good', extra: false, fix: null, note: null }
      case 'extra':
        return {
          text,
          state: 'bad',
          extra: true,
          fix: null,
          note: `«${text}» sobra: no está en la frase.`,
        }
      case 'missing':
        return {
          text,
          state: 'bad',
          extra: false,
          fix: null,
          note: `No se te oyó «${text}».`,
        }
      default:
        return buildFailedWord(word, text, syllableMap)
    }
  })
}

/** Index of the next word that still needs work after `from`, or -1. */
export function nextWordToImprove(words: WordFeedback[], from: number): number {
  return words.findIndex((w, i) => i > from && w.state !== 'good')
}

export function firstWordToImprove(words: WordFeedback[]): number {
  return words.findIndex((w) => w.state !== 'good')
}
