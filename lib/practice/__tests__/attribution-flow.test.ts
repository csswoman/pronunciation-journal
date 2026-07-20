import { describe, expect, it } from 'vitest'
import {
  ATTRIBUTION_VERSION,
  attributeSingleTarget,
  contrastId,
  isAttributedTargetEvidence,
  isLegacyAnswerPayload,
  mergeAttributionIntoPayload,
  wordBankId,
} from '@/lib/practice/attribution'
import {
  contrastIdFromResult,
  groupResultsByContrast,
} from '@/lib/phoneme-practice/finish-session'
import type { ExerciseResult } from '@/lib/practice/types'
import { resolveAnswerAttribution } from '@/lib/practice/resolve-attribution'
import type { PracticeExercise } from '@/lib/practice/types'

describe('legacy attribution quarantine', () => {
  it('treats payloads without attributionVersion as legacy', () => {
    expect(isLegacyAnswerPayload({ type: 'fill_blank' })).toBe(true)
    expect(isAttributedTargetEvidence({ type: 'fill_blank' })).toBe(false)
  })

  it('recognizes plan-062 stamped payloads as corrected-target evidence', () => {
    const attribution = attributeSingleTarget({
      target: { namespace: 'word_bank', id: wordBankId('550e8400-e29b-41d4-a716-446655440000') },
      correct: true,
    })
    const payload = mergeAttributionIntoPayload({ type: 'sentence_context' }, attribution)
    expect(payload.attributionVersion).toBe(ATTRIBUTION_VERSION)
    expect(isAttributedTargetEvidence(payload)).toBe(true)
    expect(isLegacyAnswerPayload(payload)).toBe(false)
  })

  it('does not let legacy rows claim a corrected target identity', () => {
    const legacyRows = [
      { content_id: 'ship', exercise_payload: { type: 'sentence_context' } },
      {
        content_id: 'word_bank:550e8400-e29b-41d4-a716-446655440000',
        exercise_payload: mergeAttributionIntoPayload(
          {},
          attributeSingleTarget({
            target: {
              namespace: 'word_bank',
              id: wordBankId('550e8400-e29b-41d4-a716-446655440000'),
            },
            correct: true,
          }),
        ),
      },
    ]

    const correctedTargets = legacyRows
      .filter((r) => isAttributedTargetEvidence(r.exercise_payload))
      .map((r) => r.content_id)

    expect(correctedTargets).toEqual([
      'word_bank:550e8400-e29b-41d4-a716-446655440000',
    ])
    // Legacy remains visible in the full list
    expect(legacyRows).toHaveLength(2)
  })
})

describe('match_pairs attribution policy', () => {
  it('marks match_pairs as non-SRS regardless of sourceRef', () => {
    const exercise = {
      id: 'mp-1',
      slug: 'match_pairs' as const,
      exerciseTypeId: 7,
      contentId: 'mp-1',
      context: 'practice' as const,
      payload: { kind: 'generic', data: {} as never },
      sourceRef: { source: 'word_bank' as const, id: '550e8400-e29b-41d4-a716-446655440000' },
    } satisfies PracticeExercise

    const attribution = resolveAnswerAttribution(exercise, false)
    expect(attribution).toEqual({
      srsEligible: false,
      reason: 'aggregate',
      detail: 'match_pairs aggregate score only',
    })
  })
})

describe('groupResultsByContrast', () => {
  it('groups by attributed contrast and ignores non-contrast distractors', () => {
    const completedAt = new Date()
    const a = contrastId('θ|ð')
    const b = contrastId('θ|t')
    const results: ExerciseResult[] = [
      {
        exerciseId: '1',
        slug: 'ax_same_different',
        exerciseTypeId: 12,
        isCorrect: true,
        timeMs: 100,
        contentId: '1',
        context: 'sound_lab',
        attribution: attributeSingleTarget({
          target: { namespace: 'contrast', id: a },
          correct: true,
        }),
        completedAt,
      },
      {
        exerciseId: '2',
        slug: 'match_pairs',
        exerciseTypeId: 7,
        isCorrect: false,
        timeMs: 100,
        contentId: '2',
        context: 'sound_lab',
        attribution: {
          srsEligible: false,
          reason: 'aggregate',
          detail: 'match_pairs aggregate score only',
        },
        completedAt,
      },
      {
        exerciseId: '3',
        slug: 'identify',
        exerciseTypeId: 11,
        isCorrect: false,
        timeMs: 100,
        contentId: '3',
        context: 'sound_lab',
        attribution: attributeSingleTarget({
          target: { namespace: 'contrast', id: b },
          correct: false,
        }),
        completedAt,
      },
      {
        exerciseId: '4',
        slug: 'abx',
        exerciseTypeId: 14,
        isCorrect: true,
        timeMs: 100,
        contentId: '4',
        context: 'sound_lab',
        attribution: attributeSingleTarget({
          target: { namespace: 'contrast', id: a },
          correct: true,
        }),
        completedAt,
      },
    ]

    const groups = groupResultsByContrast(results)
    expect([...groups.keys()].sort()).toEqual([a, b].sort())
    expect(groups.get(a)).toHaveLength(2)
    expect(groups.get(b)).toHaveLength(1)
    expect(contrastIdFromResult(results[1]!)).toBeNull()
  })
})
