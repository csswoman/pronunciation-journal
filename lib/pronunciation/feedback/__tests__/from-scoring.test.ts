import { describe, expect, it } from 'vitest'
import { candidatesFromWordResults, feedbackFromScoringResult } from '../from-scoring'
import { contrastTargetId } from '@/lib/pronunciation/targets/registry'
import type { WordResult } from '@/lib/types'

const mappedMismatch: WordResult[] = [{
  expected: 'thin', got: 'tin', status: 'incorrect',
  phonemes: { expected: [], got: [], tip: null, alignment: [
    { phoneme: 'TH', ipa: 'θ', status: 'incorrect', got: 'DH', gotIpa: 'ð' },
  ] },
}]

const unmappedMismatch: WordResult[] = [{
  expected: 'thin', got: 'tin', status: 'incorrect',
  phonemes: { expected: [], got: [], tip: null, alignment: [
    { phoneme: 'TH', ipa: 'θ', status: 'incorrect', got: 'T', gotIpa: 't' },
  ] },
}]

describe('feedbackFromScoringResult', () => {
  it('maps a known dictionary contrast to its canonical target', () => {
    expect(candidatesFromWordResults(mappedMismatch)[0]?.targetId).toBe(contrastTargetId('/θ/', '/ð/'))
  })

  it('keeps an unmapped projection as intelligibility instead of inventing a target', () => {
    const model = feedbackFromScoringResult({
      accuracy: 50, transcript: 'tin', wordResults: unmappedMismatch,
    })
    // θ → t is not one of the explicitly authored contrast targets.
    expect(model.signal.kind).toBe('stt_intelligibility')
    expect(model.priority).toBeNull()
  })
})
