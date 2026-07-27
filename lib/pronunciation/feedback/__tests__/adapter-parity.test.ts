import { describe, expect, it } from 'vitest'
import { feedbackFromScoringResult } from '../from-scoring'
import type { WordResult } from '@/lib/types'

const evidence: WordResult[] = [{ expected: 'then', got: 'thin', status: 'incorrect', phonemes: { expected: [], got: [], tip: null, alignment: [
  { phoneme: 'DH', ipa: 'ð', status: 'incorrect', got: 'TH', gotIpa: 'θ' },
] } }]

describe('pronunciation feedback adapter parity', () => {
  it('selects the same canonical focus for lesson, coach, and interview evidence', () => {
    const models = ['lesson-stt-v1', 'coach-stt-v1', 'interview-stt-v1'].map((evaluatorVersion) =>
      feedbackFromScoringResult({ accuracy: 60, transcript: 'thin', wordResults: evidence, evaluatorVersion }),
    )
    expect(models.map((model) => model.priority?.targetId)).toEqual([
      models[0].priority?.targetId, models[0].priority?.targetId, models[0].priority?.targetId,
    ])
    expect(models[0].priority?.targetId).toBeTruthy()
    expect(models[0].signal.kind).toBe('transcript_phoneme_inference')
  })
})
