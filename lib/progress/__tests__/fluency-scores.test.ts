import { describe, expect, it } from 'vitest'
import {
  computeSeparateLearningDimensions,
  computeFluencyScores,
  fluencyComparisonLabel,
  isFluencyProfileEmpty,
  MINIMUM_EVIDENCE_THRESHOLD,
  MAX_ATTEMPTS_PER_CONTENT,
  type FluencyRawAnswer,
  type FluencyScores,
} from '@/lib/progress/fluency-scores'

const emptyWords = { new: 0, learning: 0, review: 0, mastered: 0 }

const baseInput = {
  wordsByStatus: emptyWords,
  contrastCorrect: 0,
  contrastTotal: 0,
  essentialWordsStudied: 0,
}

function answer(
  partial: Partial<FluencyRawAnswer> & Pick<FluencyRawAnswer, 'exerciseTypeId'>,
): FluencyRawAnswer {
  return {
    context: partial.context ?? 'sound_lab',
    isCorrect: partial.isCorrect ?? true,
    grade: partial.grade ?? null,
    ...partial,
  }
}

/** Create N answers with distinct content_ids for a given exercise type */
function distinctAnswers(count: number, exerciseTypeId: number, isCorrect = true): FluencyRawAnswer[] {
  return Array.from({ length: count }, (_, i) => answer({
    exerciseTypeId,
    contentId: `content-${exerciseTypeId}-${i}`,
    isCorrect,
  }))
}

describe('computeFluencyScores', () => {
  it('returns null scores when there is no data', () => {
    const scores = computeFluencyScores({ ...baseInput, answers: [] })
    expect(scores.pronunciation.score).toBeNull()
    expect(scores.pronunciation.insufficientEvidence).toBe(true)
    expect(scores.vocabulary.score).toBeNull()
  })

  it('scores pronunciation from phoneme answers with enough evidence', () => {
    const answers = distinctAnswers(10, 3).map((a) => ({ ...a, context: 'sound_lab' }))
    const scores = computeFluencyScores({ ...baseInput, answers })
    expect(scores.pronunciation.score).toBeGreaterThan(0)
    expect(scores.pronunciation.insufficientEvidence).toBe(false)
    expect(scores.listening.score).toBeGreaterThan(0)
  })

  it('scores vocabulary from essential-words context', () => {
    const answers = Array.from({ length: 8 }, (_, i) =>
      answer({ exerciseTypeId: 10, context: 'essential-words', exercisePayload: { mode: 'speak_sentence' }, isCorrect: true, contentId: `ew-${i}` }),
    )
    const scores = computeFluencyScores({
      ...baseInput,
      answers,
      essentialWordsStudied: 12,
    })
    expect(scores.vocabulary.score).toBeGreaterThan(50)
    expect(scores.speaking.score).toBeGreaterThan(0)
  })

  it('uses word bank retention for vocabulary', () => {
    const answers = distinctAnswers(5, 5).map((a) => ({ ...a, context: 'practice' }))
    const scores = computeFluencyScores({
      ...baseInput,
      answers,
      wordsByStatus: { new: 2, learning: 3, review: 5, mastered: 10 },
    })
    expect(scores.vocabulary.score).toBeGreaterThan(0)
  })

  it('uses the canonical ids for modern exercise types', () => {
    const answers = [19, 20, 21, 22, 23].flatMap((exerciseTypeId) =>
      distinctAnswers(1, exerciseTypeId).map((a) => ({ ...a, context: 'practice' })),
    )
    const scores = computeFluencyScores({ ...baseInput, answers })
    // With only 5 distinct contents across skills, some skills may have insufficient evidence
    // but the ones that map to multiple skills should have some answers
    expect(scores.grammar.evidenceCount).toBeGreaterThan(0)
  })

  it('does not infer reading from course context alone', () => {
    const answers = distinctAnswers(5, 10).map((a) => ({ ...a, context: 'courses' }))
    const scores = computeFluencyScores({ ...baseInput, answers })
    expect(scores.reading.evidenceCount).toBe(0)
  })

  it('uses the same persisted task skill as session telemetry', () => {
    const answers = Array.from({ length: 6 }, (_, i) => answer({
      exerciseTypeId: 17,
      exercisePayload: { taskSkill: 'grammar' },
      contentId: `grammar-${i}`,
    }))
    const scores = computeFluencyScores({ ...baseInput, answers })
    expect(scores.grammar.score).toBeGreaterThan(0)
    expect(scores.reading.evidenceCount).toBe(0)
  })

  it('keeps legacy multiple-choice answers out of a skill bucket', () => {
    const scores = computeFluencyScores({
      ...baseInput,
      answers: [answer({ exerciseTypeId: 17 })],
    })
    expect(scores.reading.evidenceCount).toBe(0)
    expect(scores.grammar.evidenceCount).toBe(0)
  })

  it('scores written production as writing', () => {
    const answers = Array.from({ length: 6 }, (_, i) => answer({
      exerciseTypeId: 15,
      exercisePayload: { taskSkill: 'writing' },
      contentId: `writing-${i}`,
    }))
    const scores = computeFluencyScores({ ...baseInput, answers })
    expect(scores.writing.score).toBeGreaterThan(0)
    expect(scores.reading.evidenceCount).toBe(0)
  })
})

describe('Phase B: evidence-based scoring', () => {
  it('returns insufficient-evidence when fewer than 5 distinct content_ids', () => {
    const answers = distinctAnswers(4, 3).map((a) => ({ ...a, context: 'sound_lab' }))
    const scores = computeFluencyScores({ ...baseInput, answers })
    expect(scores.pronunciation.insufficientEvidence).toBe(true)
    expect(scores.pronunciation.score).toBeNull()
    expect(scores.pronunciation.uniqueContentCount).toBe(4)
    expect(scores.pronunciation.evidenceCount).toBe(4)
    // accuracy is still computed even when insufficient evidence
    expect(scores.pronunciation.accuracy).toBe(100)
  })

  it('returns a score when exactly 5 distinct content_ids', () => {
    const answers = distinctAnswers(MINIMUM_EVIDENCE_THRESHOLD, 3).map((a) => ({ ...a, context: 'sound_lab' }))
    const scores = computeFluencyScores({ ...baseInput, answers })
    expect(scores.pronunciation.insufficientEvidence).toBe(false)
    expect(scores.pronunciation.score).toBeGreaterThan(0)
    expect(scores.pronunciation.uniqueContentCount).toBe(5)
  })

  it('caps repeated content_id to MAX_ATTEMPTS_PER_CONTENT', () => {
    // 50 repeats of the same content_id + 4 distinct = 5 content_ids total
    const sameContent = Array.from({ length: 50 }, () => answer({
      exerciseTypeId: 3,
      context: 'sound_lab',
      contentId: 'repeated-content',
      isCorrect: true,
    }))
    const distinct4 = distinctAnswers(4, 3).map((a) => ({ ...a, context: 'sound_lab' as const }))
    const answers = [...sameContent, ...distinct4]
    const scores = computeFluencyScores({ ...baseInput, answers })
    // Should count 5 unique content_ids
    expect(scores.pronunciation.uniqueContentCount).toBe(5)
    // Should cap repeated at MAX_ATTEMPTS_PER_CONTENT: 3 + 4 = 7 total
    expect(scores.pronunciation.evidenceCount).toBe(MAX_ATTEMPTS_PER_CONTENT + 4)
  })

  it('20 failures do not elevate skill score', () => {
    const answers = distinctAnswers(20, 3).map((a) => ({
      ...a, context: 'sound_lab' as const, isCorrect: false,
    }))
    const scores = computeFluencyScores({ ...baseInput, answers })
    expect(scores.pronunciation.score).toBe(0)
    expect(scores.pronunciation.accuracy).toBe(0)
    expect(scores.pronunciation.insufficientEvidence).toBe(false)
    expect(scores.pronunciation.evidenceCount).toBe(20)
  })

  it('50 repetitions of the same content do not simulate breadth', () => {
    const answers = Array.from({ length: 50 }, () => answer({
      exerciseTypeId: 3,
      context: 'sound_lab',
      contentId: 'same-content',
      isCorrect: true,
    }))
    const scores = computeFluencyScores({ ...baseInput, answers })
    // Only 1 unique content → insufficient evidence
    expect(scores.pronunciation.uniqueContentCount).toBe(1)
    expect(scores.pronunciation.insufficientEvidence).toBe(true)
    expect(scores.pronunciation.score).toBeNull()
    // But only MAX_ATTEMPTS_PER_CONTENT counted
    expect(scores.pronunciation.evidenceCount).toBe(MAX_ATTEMPTS_PER_CONTENT)
  })

  it('treats null content_id as unique per row (legacy data)', () => {
    const answers = Array.from({ length: 6 }, () => answer({
      exerciseTypeId: 3,
      context: 'sound_lab',
      contentId: null,
      isCorrect: true,
    }))
    const scores = computeFluencyScores({ ...baseInput, answers })
    // null content_id rows are not deduplicated; each is counted
    expect(scores.pronunciation.evidenceCount).toBe(6)
    // but uniqueContentCount only counts non-null content_ids
    expect(scores.pronunciation.uniqueContentCount).toBe(0)
  })

  it('a single evidence stays insufficient, not zero', () => {
    const answers = distinctAnswers(1, 3).map((a) => ({ ...a, context: 'sound_lab' }))
    const scores = computeFluencyScores({ ...baseInput, answers })
    expect(scores.pronunciation.score).toBeNull()
    expect(scores.pronunciation.evidenceCount).toBe(1)
    expect(isFluencyProfileEmpty(scores)).toBe(false)
  })

  it('counts grade 0 answers as real failed evidence', () => {
    const answers = distinctAnswers(5, 3).map((a) => ({
      ...a, context: 'sound_lab' as const, isCorrect: false, grade: 0,
    }))
    const scores = computeFluencyScores({ ...baseInput, answers })
    expect(scores.pronunciation.evidenceCount).toBe(5)
    expect(scores.pronunciation.score).toBe(0)
  })

  it('keeps the most recent attempts per content_id, including failures', () => {
    const repeat = (isCorrect: boolean) => answer({
      exerciseTypeId: 3, context: 'sound_lab', contentId: 'repeated', isCorrect,
    })
    // Oldest → newest: 3 old hits, then 3 recent misses.
    const answers = [true, true, true, false, false, false].map(repeat)
    const scores = computeFluencyScores({ ...baseInput, answers })
    expect(scores.pronunciation.evidenceCount).toBe(MAX_ATTEMPTS_PER_CONTENT)
    expect(scores.pronunciation.accuracy).toBe(0)
  })

  it('formula uses 0.75 accuracy + 0.25 retention (no frequency)', () => {
    // 10 answers all correct + vocab retention 50%
    const answers = distinctAnswers(10, 5).map((a) => ({ ...a, context: 'practice' }))
    const scores = computeFluencyScores({
      ...baseInput,
      answers,
      wordsByStatus: { new: 5, learning: 0, review: 0, mastered: 5 },
    })
    // accuracy = 100, retention = 50 (mastered/total = 5/10 = 50%)
    // score = round(min(100, 0.75 * 100 + 0.25 * 50)) = round(87.5) = 88
    expect(scores.vocabulary.score).toBe(88)
  })
})

describe('progress metric invariants', () => {
  it('does not add independent saved and verified signals to the word-bank denominator', () => {
    const dimensions = computeSeparateLearningDimensions({
      ...baseInput,
      answers: [],
      wordsByStatus: {
        new: 1,
        learning: 0,
        review: 0,
        mastered: 1,
        saved: 2,
        verified: 1,
      } as typeof emptyWords,
    })

    expect(dimensions.coverage.wordBankTotal).toBe(2)
    expect(dimensions.retention.overallPct).toBe(50)
  })
})

describe('fluencyComparisonLabel', () => {
  it('detects improvement', () => {
    const scored = (v: number) => ({
      score: v, accuracy: v, uniqueContentCount: 10, evidenceCount: 20, insufficientEvidence: false,
    })
    const prev: FluencyScores = {
      pronunciation: scored(20),
      grammar: scored(20),
      vocabulary: scored(20),
      listening: scored(20),
      speaking: scored(20),
      reading: scored(20),
      writing: scored(20),
    }
    const cur = { ...prev, pronunciation: scored(50), vocabulary: scored(50) }
    expect(fluencyComparisonLabel(cur, prev)).toBe('Mejorando esta semana')
  })
})

describe('isFluencyProfileEmpty', () => {
  it('returns true when all scores are null with no evidence', () => {
    const scores = computeFluencyScores({ ...baseInput, answers: [] })
    expect(isFluencyProfileEmpty(scores)).toBe(true)
  })

  it('returns false when at least one skill has evidence', () => {
    const answers = distinctAnswers(6, 3).map((a) => ({ ...a, context: 'sound_lab' }))
    const scores = computeFluencyScores({ ...baseInput, answers })
    expect(isFluencyProfileEmpty(scores)).toBe(false)
  })
})
