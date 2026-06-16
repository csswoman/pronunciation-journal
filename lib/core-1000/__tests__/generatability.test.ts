// CI gate: Core 1000 words must be eligible for key exercise generators at
// documented rates. Run via `pnpm validate:core1000-generators`.
import { describe, expect, it } from 'vitest'
import { coreWordToWordBankEntry } from '@/lib/core-1000/client-fetch'
import { loadCoreWords } from '@/lib/core-1000/data'
import type { CoreWord } from '@/lib/core-1000/types'
import {
  assessWordBankEntry,
  DISTRACTOR_COUNT,
  type EligibilityReason,
  type ExerciseMode,
} from '@/lib/exercises/eligibility'
import type { WordBankEntry } from '@/lib/word-bank/types'

/** Documented in Plan 017 Phase 5 — adjust only after measuring real dataset rates. */
const THRESHOLDS: Readonly<Record<'fill_blank' | 'reorder_words' | 'sentence_dictation', number>> = {
  fill_blank: 0.85,
  reorder_words: 0.95,
  sentence_dictation: 0.98,
}

interface ModeReport {
  mode: ExerciseMode
  eligible: number
  total: number
  rate: number
  failures: Array<{ rank: number; word: string; reasons: EligibilityReason[] }>
}

function assessFillBlankWithPool(
  entries: WordBankEntry[],
  rankByText: Map<string, number>,
): ModeReport {
  const baseEligible = entries.map((entry) => ({
    entry,
    result: assessWordBankEntry(entry, 'fill_blank'),
  }))
  const distractorPool = baseEligible
    .filter(({ result }) => result.eligible)
    .map(({ entry }) => entry)

  const failures: ModeReport['failures'] = []
  let eligible = 0

  for (const { entry, result } of baseEligible) {
    if (!result.eligible) {
      failures.push({
        rank: rankByText.get(entry.text) ?? -1,
        word: entry.text,
        reasons: result.reasons,
      })
      continue
    }

    const distractors = distractorPool.filter(
      (candidate) => candidate.id !== entry.id && candidate.text !== entry.text,
    )
    if (distractors.length < DISTRACTOR_COUNT) {
      failures.push({
        rank: rankByText.get(entry.text) ?? -1,
        word: entry.text,
        reasons: ['insufficient_distractor_pool'],
      })
      continue
    }

    eligible += 1
  }

  return {
    mode: 'fill_blank',
    eligible,
    total: entries.length,
    rate: entries.length === 0 ? 0 : eligible / entries.length,
    failures,
  }
}

function assessSimpleMode(
  entries: WordBankEntry[],
  rankByText: Map<string, number>,
  mode: 'reorder_words' | 'sentence_dictation',
): ModeReport {
  const failures: ModeReport['failures'] = []
  let eligible = 0

  for (const entry of entries) {
    const result = assessWordBankEntry(entry, mode)
    if (result.eligible) {
      eligible += 1
    } else {
      failures.push({
        rank: rankByText.get(entry.text) ?? -1,
        word: entry.text,
        reasons: result.reasons,
      })
    }
  }

  return {
    mode,
    eligible,
    total: entries.length,
    rate: entries.length === 0 ? 0 : eligible / entries.length,
    failures,
  }
}

function formatFailureReport(report: ModeReport, limit = 25): string {
  const threshold = THRESHOLDS[report.mode as keyof typeof THRESHOLDS]
  const header = `${report.mode}: ${report.eligible}/${report.total} (${(report.rate * 100).toFixed(1)}%) — need ≥ ${(threshold * 100).toFixed(0)}%`
  const lines = report.failures
    .slice(0, limit)
    .map((f) => `  #${f.rank} ${f.word} [${f.reasons.join(', ')}]`)
  const more =
    report.failures.length > limit
      ? [`  … and ${report.failures.length - limit} more`]
      : []
  return [header, ...lines, ...more].join('\n')
}

function rankByLemma(words: CoreWord[]): Map<string, number> {
  return new Map(words.map((w) => [w.word, w.rank]))
}

describe('Core 1000 generator eligibility', () => {
  const words = loadCoreWords()
  const entries = words.map(coreWordToWordBankEntry)
  const ranks = rankByLemma(words)

  it('has a non-empty dataset', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  it('fill_blank eligibility ≥ 85%', () => {
    const report = assessFillBlankWithPool(entries, ranks)
    expect(report.rate, `\n${formatFailureReport(report)}`).toBeGreaterThanOrEqual(
      THRESHOLDS.fill_blank,
    )
  })

  it('reorder_words eligibility ≥ 95%', () => {
    const report = assessSimpleMode(entries, ranks, 'reorder_words')
    expect(report.rate, `\n${formatFailureReport(report)}`).toBeGreaterThanOrEqual(
      THRESHOLDS.reorder_words,
    )
  })

  it('sentence_dictation eligibility ≥ 98%', () => {
    const report = assessSimpleMode(entries, ranks, 'sentence_dictation')
    expect(report.rate, `\n${formatFailureReport(report)}`).toBeGreaterThanOrEqual(
      THRESHOLDS.sentence_dictation,
    )
  })
})
