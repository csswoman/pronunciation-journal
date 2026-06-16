import { describe, expect, it } from 'vitest'
import { loadCoreWords } from '@/lib/core-1000/data'
import { coreWordToWordBankEntry } from '@/lib/core-1000/client-fetch'
import { assessWordBankEntry } from '@/lib/exercises/eligibility'
import { generateFillBlankFromWordBank } from '@/lib/exercises/generators/fill-blank'
import { buildWordReviewStep } from '@/lib/practice/daily-plan/step-builders'

/** Ranks 60–79: mix of inflected examples post–Plan 017 without function words. */
const CORE_SAMPLE_MIN_RANK = 60
const CORE_SAMPLE_MAX_RANK = 79

/** Target generatability for fill_blank on the sample (documented in Plan 017 Phase 4). */
const MIN_FILL_BLANK_GENERATABILITY = 0.85

describe('buildWordReviewStep integration', () => {
  function sampleCoreEntries() {
    return loadCoreWords()
      .filter(
        (w) =>
          w.rank >= CORE_SAMPLE_MIN_RANK &&
          w.rank <= CORE_SAMPLE_MAX_RANK &&
          w.word.length >= 4,
      )
      .map(coreWordToWordBankEntry)
  }

  it('produces a word_review step with exercises from a Core 1000 sample', () => {
    const entries = sampleCoreEntries()
    expect(entries.length).toBeGreaterThanOrEqual(10)

    const step = buildWordReviewStep(entries)
    expect(step).not.toBeNull()
    expect(step!.kind).toBe('word_review')
    // fill_blank(2) + dictation(2) minimum when examples exist; reorder adds more.
    expect(step!.exercises.length).toBeGreaterThanOrEqual(4)
    expect(step!.exercises.some((e) => e.slug === 'fill_blank')).toBe(true)
  })

  it(`fill_blank generatability on ranks ${CORE_SAMPLE_MIN_RANK}–${CORE_SAMPLE_MAX_RANK} is ≥ ${MIN_FILL_BLANK_GENERATABILITY * 100}%`, () => {
    const entries = sampleCoreEntries()
    const eligible = entries.filter(
      (e) => assessWordBankEntry(e, 'fill_blank', { pool: entries }).eligible,
    )
    expect(eligible.length).toBeGreaterThan(0)

    const { exercises } = generateFillBlankFromWordBank(entries, eligible.length)
    const rate = exercises.length / eligible.length

    expect(rate).toBeGreaterThanOrEqual(MIN_FILL_BLANK_GENERATABILITY)
  })
})
