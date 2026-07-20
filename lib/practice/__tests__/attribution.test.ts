import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  attributeGroupResult,
  attributeSingleTarget,
  contrastId,
  lexiconContentId,
  nonSrsAttribution,
  wordBankId,
  wordBankTargetFromResolvedBank,
  type EvidenceAttribution,
  type EvidenceTarget,
  type LexiconContentId,
  type TargetOutcome,
  type WordBankId,
} from '@/lib/practice/attribution'

describe('evidence attribution contract', () => {
  it('keeps word_bank and lexicon ids in distinct namespaces at the type level', () => {
    const bank = wordBankId('550e8400-e29b-41d4-a716-446655440000')
    const lexicon = lexiconContentId('ship')

    expectTypeOf(bank).toEqualTypeOf<WordBankId>()
    expectTypeOf(lexicon).toEqualTypeOf<LexiconContentId>()
    expectTypeOf(bank).not.toEqualTypeOf<LexiconContentId>()
    expectTypeOf(lexicon).not.toEqualTypeOf<WordBankId>()

    const bankTarget = {
      namespace: 'word_bank' as const,
      id: bank,
    } satisfies EvidenceTarget
    expect(bankTarget.namespace).toBe('word_bank')

    // @ts-expect-error lexicon content id is not a word_bank id
    const _invalidBankTarget: EvidenceTarget = {
      namespace: 'word_bank',
      id: lexicon,
    }
    void _invalidBankTarget
  })

  it('requires an explicit group policy instead of inventing a single-target update', () => {
    const outcomes: TargetOutcome[] = [
      {
        target: { namespace: 'word_bank', id: wordBankId('a') },
        correct: true,
      },
      {
        target: { namespace: 'word_bank', id: wordBankId('b') },
        correct: false,
      },
    ]

    const perTarget = attributeGroupResult({ mode: 'per_target', outcomes })
    expect(perTarget.srsEligible).toBe(true)
    if (perTarget.srsEligible) {
      expect(perTarget.outcomes).toEqual(outcomes)
    }

    const nonSrs = attributeGroupResult({
      mode: 'non_srs',
      reason: 'match_pairs aggregate score only',
    })
    expect(nonSrs).toEqual({
      srsEligible: false,
      reason: 'aggregate',
      detail: 'match_pairs aggregate score only',
    } satisfies EvidenceAttribution)

    // @ts-expect-error group results must declare per_target or non_srs
    attributeGroupResult({ mode: 'first_word', outcomes })
  })

  it('builds one-to-one and non-SRS attributions', () => {
    const single = attributeSingleTarget({
      target: { namespace: 'contrast', id: contrastId('θ|ð') },
      correct: true,
      score: 80,
    })
    expect(single.srsEligible).toBe(true)
    if (single.srsEligible) {
      expect(single.outcomes).toHaveLength(1)
      expect(single.outcomes[0]?.target).toEqual({
        namespace: 'contrast',
        id: contrastId('θ|ð'),
      })
    }

    expect(nonSrsAttribution('unsaved')).toEqual({
      srsEligible: false,
      reason: 'unsaved',
    })
  })

  it('only promotes lexicon items to word_bank via an explicit resolved UUID', () => {
    const bank = wordBankId('550e8400-e29b-41d4-a716-446655440000')
    const lexicon = lexiconContentId('ship')

    expect(wordBankTargetFromResolvedBank(bank)).toEqual({
      namespace: 'word_bank',
      id: bank,
    })

    // @ts-expect-error must pass a WordBankId, not a lexicon content id
    wordBankTargetFromResolvedBank(lexicon)
  })
})
