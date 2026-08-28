import { describe, expect, it } from 'vitest'
import { loadEssentialWords } from '@/lib/essential-words/data'
import { coreWordToWordBankEntry } from '@/lib/essential-words/client-fetch'
import { assessWordBankEntry } from '@/lib/exercises/eligibility'
import { generateFillBlankFromWordBank } from '@/lib/exercises/generators/fill-blank'
import { buildWordReviewStep } from '@/lib/practice/daily-plan/step-builders'
import { makeLexiconWordBankEntry, makeWordBankEntry } from '@/lib/exercises/__tests__/fixtures/word-bank-entry'
import type { WordCategoryIndex } from '@/lib/lexicon/domain-profile'

/** Ranks 60–79: mix of inflected examples post–Plan 017 without function words. */
const CORE_SAMPLE_MIN_RANK = 60
const CORE_SAMPLE_MAX_RANK = 79

/** Target generatability for fill_blank on the sample (documented in Plan 017 Phase 4). */
const MIN_FILL_BLANK_GENERATABILITY = 0.85

describe('buildWordReviewStep integration', () => {
  function sampleCoreEntries() {
    return loadEssentialWords()
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

    const step = buildWordReviewStep(entries, 'daily')
    expect(step).not.toBeNull()
    expect(step!.kind).toBe('word_review')
    expect(step!.exercises.length).toBeGreaterThanOrEqual(3)
    expect(step!.exercises.some((e) => e.slug === 'fill_blank')).toBe(true)
    // B3: match_pairs and sentence_dictation are excluded from the daily plan
    expect(step!.exercises.some((e) => e.slug === 'sentence_dictation')).toBe(false)
    expect(step!.exercises.some((e) => e.slug === 'match_pairs')).toBe(false)

    // Free practice context includes them
    const freeStep = buildWordReviewStep(entries, 'practice')
    expect(freeStep!.exercises.some((e) => e.slug === 'sentence_dictation')).toBe(true)
    expect(freeStep!.exercises.some((e) => e.slug === 'match_pairs')).toBe(true)
  })

  it('B7: guarantees a Rodeo (circumlocution) and a spoken tense-transform slot in spoken production', () => {
    const entries = sampleCoreEntries()
    const step = buildWordReviewStep(entries, 'daily')
    expect(step).not.toBeNull()

    const spokenExercises = step!.exercises.filter((e) => e.slug === 'spoken_production')
    const constraintIds = spokenExercises.map(
      (e) => (e.payload as { kind: 'generic'; data: { constraintId?: string } }).data.constraintId,
    )
    expect(constraintIds).toContain('rodeo_circumlocution')
    expect(constraintIds).toContain('spoken_verb_transform')
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

  describe('study mode (plan 077 phase 3)', () => {
    // Enough entries that fill_blank/dictation/etc. still generate normally —
    // the assertions below only care whether *production* exercises
    // (written/spoken) reference the receptive word.
    const wordIndex: WordCategoryIndex = new Map([
      ['receptive-term', ['artificial-intelligence']], // engineering -> receptive
      ['productive-term', ['professional']], // professional -> productive
    ])

    function poolWithTargets() {
      const filler = Array.from({ length: 10 }, (_, i) =>
        makeWordBankEntry({ id: `filler-${i}`, text: `filler${i}` }),
      )
      const receptive = makeLexiconWordBankEntry({
        id: 'receptive-1',
        text: 'ReceptiveTerm',
        source_ref: 'receptive-term',
      })
      const productive = makeLexiconWordBankEntry({
        id: 'productive-1',
        text: 'ProductiveTerm',
        source_ref: 'productive-term',
      })
      return { filler, receptive, productive }
    }

    function productionSourceIds(step: ReturnType<typeof buildWordReviewStep>): string[] {
      return step!.exercises
        .filter((e) => e.slug === 'spoken_production' || e.slug === 'written_production')
        .map((e) => {
          const data = (e.payload as { kind: 'generic'; data: { sourceRef?: { id?: string } } }).data
          return data.sourceRef?.id ?? ''
        })
    }

    it('excludes a receptive-category word from production exercises when a wordIndex is given', () => {
      const { filler, receptive, productive } = poolWithTargets()
      const step = buildWordReviewStep([...filler, receptive, productive], 'daily', undefined, wordIndex)
      expect(step).not.toBeNull()

      const ids = productionSourceIds(step)
      expect(ids).not.toContain(receptive.id)
    })

    it('keeps a productive-category word eligible for production exercises', () => {
      const { filler, receptive, productive } = poolWithTargets()
      const step = buildWordReviewStep([...filler, receptive, productive], 'daily', undefined, wordIndex)
      expect(step).not.toBeNull()

      const ids = productionSourceIds(step)
      expect(ids).toContain(productive.id)
    })

    it('does not filter production eligibility when no wordIndex is passed (backward compatible)', () => {
      const { filler, receptive, productive } = poolWithTargets()
      const step = buildWordReviewStep([...filler, receptive, productive], 'daily')
      expect(step).not.toBeNull()

      const ids = productionSourceIds(step)
      expect(ids).toContain(receptive.id)
    })

    it('still generates a word_review step (recognition exercises unaffected by study mode)', () => {
      const { filler, receptive, productive } = poolWithTargets()
      const step = buildWordReviewStep([...filler, receptive, productive], 'daily', undefined, wordIndex)
      expect(step).not.toBeNull()
      expect(step!.exercises.length).toBeGreaterThan(0)
    })
  })
})

import { buildWordIntroStep } from '@/lib/practice/daily-plan/step-builders'
import { WORD_INTRO_MAX_CARDS } from '@/lib/practice/daily-plan/constants'
import type { WordBankEntry } from '@/lib/word-bank/types'

function wbEntry(over: Partial<WordBankEntry>): WordBankEntry {
  return {
    id: 'wb', user_id: 'u', text: 'word', meaning: 'm', translation: 't',
    ipa: '/w/', example: 'A word here.', audio_url: null, synonyms: null,
    image_prompt: null, source: null, source_ref: null, context: null,
    status: 'active', srs_status: 'new', difficulty: 1, ease_factor: 2.5,
    interval_days: 1, repetitions: 0, review_count: 0, next_review_at: null,
    last_reviewed_at: null, has_audio: null, audio_fetch_attempts: 0,
    error_reason: null, created_at: '', updated_at: '',
    ...over,
  } as WordBankEntry
}

describe('buildWordIntroStep', () => {
  it('returns null when there are no new words', () => {
    const entries = [wbEntry({ id: 'a', srs_status: 'review' })]
    expect(buildWordIntroStep(entries)).toBeNull()
  })

  it('builds a word_intro step with study cards for new words only', () => {
    const entries = [
      wbEntry({ id: 'a', text: 'alpha', srs_status: 'new' }),
      wbEntry({ id: 'b', text: 'beta', srs_status: 'review' }),
      wbEntry({ id: 'c', text: 'gamma', srs_status: 'new' }),
    ]
    const step = buildWordIntroStep(entries)
    expect(step).not.toBeNull()
    expect(step!.kind).toBe('word_intro')
    expect(step!.exercises).toEqual([])
    expect(step!.studyCards!.map((c) => c.word)).toEqual(['alpha', 'gamma'])
  })

  it('caps the number of cards at WORD_INTRO_MAX_CARDS', () => {
    const entries = Array.from({ length: WORD_INTRO_MAX_CARDS + 3 }, (_, i) =>
      wbEntry({ id: `n${i}`, text: `w${i}`, srs_status: 'new' }),
    )
    const step = buildWordIntroStep(entries)
    expect(step!.studyCards!.length).toBe(WORD_INTRO_MAX_CARDS)
  })
})
