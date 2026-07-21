import { describe, expect, it } from 'vitest'
import { evidenceCopyForModality } from '../progress-copy'

describe('pronunciation evidence copy', () => {
  it('keeps pronunciation-adjacent wording behind the feature flag', () => {
    expect(evidenceCopyForModality('stt_intelligibility', false)).toBe('Evidencia objetiva')
    expect(evidenceCopyForModality('stt_intelligibility', true)).toBe('Inteligible en STT')
  })
})
