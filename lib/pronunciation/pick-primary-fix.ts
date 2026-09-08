// lib/pronunciation/pick-primary-fix.ts
import type { PhonemeAlignment, WordResult } from '@/lib/types'
import type { SyllableResult } from './syllable-scoring'
import { isVowelPhoneme } from './arpabet-vowels'

export interface PrimaryFix {
  syllableText: string
  culprit: PhonemeAlignment
}

/**
 * Picks the single failure worth explaining after a spoken line.
 * Priority: vowel culprit in a failed syllable > consonant culprit in a failed
 * syllable > first non-correct phoneme of the first incorrect word (whole word).
 */
export function pickPrimaryFix(
  wordResults: WordResult[],
  syllableMap: Map<string, SyllableResult[]>,
): PrimaryFix | null {
  const syllableCulprits: { syllableText: string; culprit: PhonemeAlignment }[] = []
  for (const word of wordResults) {
    for (const syllable of syllableMap.get(word.expected) ?? []) {
      if (syllable.culprit) {
        syllableCulprits.push({ syllableText: syllable.text, culprit: syllable.culprit })
      }
    }
  }

  const vowel = syllableCulprits.find((c) => isVowelPhoneme(c.culprit.phoneme))
  if (vowel) return vowel
  if (syllableCulprits.length > 0) return syllableCulprits[0]

  const firstIncorrect = wordResults.find((w) => w.status === 'incorrect')
  const failed = firstIncorrect?.phonemes?.alignment?.find((p) => p.status !== 'correct')
  if (firstIncorrect && failed) {
    return { syllableText: firstIncorrect.expected, culprit: failed }
  }
  return null
}
