import { describe, it, expect } from 'vitest'
import { computeBenchmarkMetrics, type BenchmarkTrial } from '../metrics'

describe('computeBenchmarkMetrics', () => {
  const trials: BenchmarkTrial[] = [
    { targetVowel: 'iː', predictedVowel: 'iː', abstained: false, humanScore: 90 },
    { targetVowel: 'iː', predictedVowel: 'ɪ', abstained: false, humanScore: 40 },
    { targetVowel: 'ɪ', predictedVowel: 'ɪ', abstained: false, humanScore: 85 },
    { targetVowel: 'ɪ', predictedVowel: null, abstained: true, humanScore: 20 },
  ]

  it('computes overall agreement rate across non-abstained trials', () => {
    const metrics = computeBenchmarkMetrics(trials)
    // 2 correct out of 3 non-abstained trials
    expect(metrics.agreementRate).toBeCloseTo(2 / 3, 5)
  })

  it('computes per-contrast agreement rate', () => {
    const metrics = computeBenchmarkMetrics(trials)
    expect(metrics.perVowelAgreement['iː']).toBeCloseTo(0.5, 5)
    expect(metrics.perVowelAgreement['ɪ']).toBeCloseTo(1, 5)
  })

  it('computes abstention rate across all trials', () => {
    const metrics = computeBenchmarkMetrics(trials)
    expect(metrics.abstentionRate).toBeCloseTo(0.25, 5)
  })

  it('builds a confusion matrix of target vowel vs predicted vowel', () => {
    const metrics = computeBenchmarkMetrics(trials)
    expect(metrics.confusionMatrix['iː']['ɪ']).toBe(1)
    expect(metrics.confusionMatrix['ɪ']['ɪ']).toBe(1)
  })
})
