import { describe, expect, it } from 'vitest'
import { applyContrastObservation, dictationContrastEvidence, MIN_RANKING_OBSERVATIONS, weakestEligibleContrast, rankingIsCompatibleWithDiscriminationOnly } from '../contrast-profile-writer'

describe('essential-words contrast profile writer', () => {
  it('uses EMA, counts every observation, and keeps spelling/grammar neutral', () => {
    const failed = applyContrastObservation({ score: 0, observationCount: 0 }, false)
    const recovered = applyContrastObservation(failed, true)
    expect(failed).toEqual({ score: 0.21, observationCount: 1 })
    expect(recovered.observationCount).toBe(2)
    expect(recovered.score).toBeCloseTo(0.147)
    expect(MIN_RANKING_OBSERVATIONS).toBe(3)
    expect(dictationContrastEvidence([{ categoria: 'spelling' }, { categoria: 'grammatical' }], 1)).toEqual([])
  })
  it('writes only attributed phonetic substitutions and never tier-3 dictation', () => {
    const words = [{ categoria: 'phonetic_substitution' as const, contrastId: '/ɪ/|/iː/' }, { categoria: 'omission' as const, contrastId: '/ɪ/|/iː/' }]
    expect(dictationContrastEvidence(words, 1)).toEqual([{ contrastId: '/ɪ/|/iː/', correct: false, weight: 0.7 }])
    expect(dictationContrastEvidence(words, 3)).toEqual([])
  })
  it('uses cold start until a contrast has three observations', () => {
    expect(weakestEligibleContrast([{ contrastId: '/b/|/v/', score: 0.7, observationCount: 1 }], ['/ɪ/|/iː/'])).toBe('/ɪ/|/iː/')
  })
  it('preserves a discrimination-only ranking when dictation contributes no substitution', () => {
    const rows = [{ contrastId: '/b/|/v/', score: 0.8, observationCount: 6 }, { contrastId: '/ɪ/|/iː/', score: 0.4, observationCount: 4 }]
    expect(rankingIsCompatibleWithDiscriminationOnly(rows, ['/s/|/z/'])).toBe('/b/|/v/')
    expect(dictationContrastEvidence([{ categoria: 'spelling' }], 1)).toEqual([])
  })
})
