import type { WritingHintMatch } from './types'
import {
  detectIrregularPast,
  detectMissingPastEd,
  detectAmAgree,
  detectDoubleNegative,
  detectMissingThirdPersonS,
  detectIrregularPlural,
  detectMissingApostrophe,
} from './rules'

const ALL_RULES = [
  detectIrregularPast,
  detectMissingPastEd,
  detectAmAgree,
  detectDoubleNegative,
  detectMissingThirdPersonS,
  detectIrregularPlural,
  detectMissingApostrophe,
]

/**
 * Runs every writing-hint rule and resolves overlaps by keeping the
 * earliest-starting match; a later match overlapping a kept range is dropped.
 */
export function detectWritingHints(text: string): WritingHintMatch[] {
  const all = ALL_RULES.flatMap((rule) => rule(text)).sort((a, b) => a.start - b.start)
  const resolved: WritingHintMatch[] = []
  let lastEnd = -1
  for (const match of all) {
    if (match.start < lastEnd) continue
    resolved.push(match)
    lastEnd = match.end
  }
  return resolved
}
