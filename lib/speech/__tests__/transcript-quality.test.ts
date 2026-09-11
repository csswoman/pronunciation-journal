import { describe, expect, it } from 'vitest'
import {
  MIN_SCORABLE_CONFIDENCE,
  isTranscriptScorable,
  transcriptAbstentionReason,
} from '../transcript-quality'

describe('transcript quality gate', () => {
  it('scores a confident native transcript', () => {
    expect(
      isTranscriptScorable({ transcript: 'hello', confidence: 0.92, source: 'web-speech' })
    ).toBe(true)
  })

  it('abstains when the recognizer was barely sure of what it heard', () => {
    const attempt = { transcript: 'hello', confidence: 0.2, source: 'web-speech' as const }
    expect(isTranscriptScorable(attempt)).toBe(false)
    expect(transcriptAbstentionReason(attempt)).toBe('low_confidence')
  })

  it('abstains on an empty transcript regardless of confidence', () => {
    const attempt = { transcript: '   ', confidence: 0.99, source: 'web-speech' as const }
    expect(isTranscriptScorable(attempt)).toBe(false)
    expect(transcriptAbstentionReason(attempt)).toBe('empty_transcript')
  })

  it('treats the boundary confidence as scorable', () => {
    expect(
      isTranscriptScorable({
        transcript: 'hello',
        confidence: MIN_SCORABLE_CONFIDENCE,
        source: 'web-speech',
      })
    ).toBe(true)
  })

  it('scores a Gemini transcript that carries no confidence value', () => {
    // Gemini returns text only. Absent confidence must not read as zero
    // confidence, or every fallback attempt would abstain.
    const attempt = { transcript: 'hello', source: 'gemini' as const }
    expect(isTranscriptScorable(attempt)).toBe(true)
    expect(transcriptAbstentionReason(attempt)).toBeNull()
  })

  it('reports no abstention reason for a scorable attempt', () => {
    expect(
      transcriptAbstentionReason({ transcript: 'hello', confidence: 0.9, source: 'web-speech' })
    ).toBeNull()
  })
})
