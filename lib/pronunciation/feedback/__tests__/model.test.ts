import { describe, expect, it } from 'vitest'
import { buildPronunciationFeedback } from '../model'
import { prioritizeFeedbackTarget } from '../prioritize'
import { contrastTargetId } from '@/lib/pronunciation/targets/registry'

const th = contrastTargetId('/θ/', '/ð/')

describe('pronunciation feedback contract', () => {
  it('only chooses a valid canonical target with sufficient evidence', () => {
    expect(prioritizeFeedbackTarget([
      { targetId: 'invented.target', confidence: 1 },
      { targetId: th, confidence: 0.59 },
    ])).toBeNull()
  })

  it('ranks one target deterministically by confidence, relevance, and recurrence', () => {
    const priority = prioritizeFeedbackTarget([
      { targetId: th, confidence: 0.8, relevance: 1, recurrence: 1, expected: '/θ/' },
      { targetId: th, confidence: 0.8, relevance: 2, recurrence: 1, expected: '/ð/' },
    ])
    expect(priority?.expected).toBe('/ð/')
  })

  it('labels transcript inference without claiming acoustic precision', () => {
    const model = buildPronunciationFeedback({
      signal: {
        kind: 'transcript_phoneme_inference',
        evaluatorVersion: 'dictionary-v1',
        confidence: 0.9,
        transcript: 'tin',
        inferredContrast: { expected: '/θ/', observed: '/t/' },
      },
      candidates: [{ targetId: th, confidence: 0.9, expected: '/θ/', observed: '/t/' }],
    })
    expect(model.signal.kind).toBe('transcript_phoneme_inference')
    expect(model.summaryEs).toContain('no es una medición acústica')
    expect(model.priority?.targetId).toBe(th)
  })

  it('keeps unscored attempts out of improvement claims', () => {
    const model = buildPronunciationFeedback({
      signal: { kind: 'unscored', reason: 'evaluator_unavailable' },
      candidates: [{ targetId: th, confidence: 1 }],
    })
    expect(model.outcome).toBe('unscored')
    expect(model.priority).toBeNull()
  })

  it('does not compare attempts across evaluator versions', () => {
    const previous = buildPronunciationFeedback({
      signal: { kind: 'stt_intelligibility', evaluatorVersion: 'stt-v1', confidence: 1, transcript: 'thin', recognizedPercent: 80 },
      candidates: [{ targetId: th, confidence: 1 }],
    })
    const current = buildPronunciationFeedback({
      signal: { kind: 'stt_intelligibility', evaluatorVersion: 'stt-v2', confidence: 1, transcript: 'thin', recognizedPercent: 90 },
      candidates: [{ targetId: th, confidence: 1 }],
      previous,
    })
    expect(current.outcome).toBe('needs_more_evidence')
  })

  it('marks improvement only for the same target and evaluator version', () => {
    const previous = buildPronunciationFeedback({
      signal: { kind: 'stt_intelligibility', evaluatorVersion: 'stt-v1', confidence: 1, transcript: 'tin', recognizedPercent: 60 },
      candidates: [{ targetId: th, confidence: 1 }],
    })
    const current = buildPronunciationFeedback({
      signal: { kind: 'stt_intelligibility', evaluatorVersion: 'stt-v1', confidence: 1, transcript: 'thin', recognizedPercent: 80 },
      candidates: [{ targetId: th, confidence: 1 }],
      previous,
    })
    expect(current.outcome).toBe('improved')
  })
})
