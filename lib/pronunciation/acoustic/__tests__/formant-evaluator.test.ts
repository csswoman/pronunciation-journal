import { describe, it, expect } from 'vitest'
import { FormantVowelEvaluator } from '../formant-evaluator'
import { VOWEL_CENTROIDS } from '../vowel-space'

function synthesizeVowelSignal(sampleRate: number, durationMs: number, f1: number, f2: number): Float32Array {
  const numSamples = Math.round((durationMs / 1000) * sampleRate)
  const samples = new Float32Array(numSamples)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    samples[i] = (Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t)) / 2
  }
  return samples
}

describe('FormantVowelEvaluator', () => {
  it('scores the segmental dimension for a clean synthetic /iː/-like signal', async () => {
    const evaluator = new FormantVowelEvaluator()
    const sampleRate = 16000
    const centroid = VOWEL_CENTROIDS['iː']
    const samples = synthesizeVowelSignal(sampleRate, 200, centroid.f1Hz, centroid.f2Hz)

    const result = await evaluator.evaluate({
      audio: { uri: 'mem://synthetic', durationMs: 200 },
      targetText: 'sheep',
      transcript: 'sheep',
      dimensions: ['segmental'],
      samples,
      sampleRate,
      targetVowel: 'iː',
    } as never)

    expect(result.evaluatorKind).toBe('formant_dsp')
    expect(result.outcome).toBe('scored')
    const segmental = result.dimensionScores.find((d) => d.dimension === 'segmental')
    expect(segmental?.abstained).toBe(false)
    expect(segmental?.score).toBeGreaterThan(0)
  })

  it('abstains when the requested target vowel is outside the v1 contrast set', async () => {
    const evaluator = new FormantVowelEvaluator()
    const sampleRate = 16000
    const samples = synthesizeVowelSignal(sampleRate, 200, 500, 1500)

    const result = await evaluator.evaluate({
      audio: { uri: 'mem://synthetic', durationMs: 200 },
      targetText: 'the',
      transcript: 'the',
      dimensions: ['segmental'],
      samples,
      sampleRate,
      targetVowel: 'ə', // schwa is out of the v1 vowel-contrast scope
    } as never)

    const segmental = result.dimensionScores.find((d) => d.dimension === 'segmental')
    expect(segmental?.abstained).toBe(true)
    expect(segmental?.abstainReason).toBe('vowel_out_of_scope')
  })

  it('abstains on low-quality audio instead of guessing', async () => {
    const evaluator = new FormantVowelEvaluator()
    const sampleRate = 16000
    const silence = new Float32Array(Math.round(sampleRate * 0.2))

    const result = await evaluator.evaluate({
      audio: { uri: 'mem://synthetic', durationMs: 200 },
      targetText: 'sheep',
      transcript: 'sheep',
      dimensions: ['segmental'],
      samples: silence,
      sampleRate,
      targetVowel: 'iː',
    } as never)

    const segmental = result.dimensionScores.find((d) => d.dimension === 'segmental')
    expect(segmental?.abstained).toBe(true)
    expect(segmental?.abstainReason).toBe('low_snr')
  })

  it('abstains on non-segmental dimensions — this evaluator only handles vowel segmentals', async () => {
    const evaluator = new FormantVowelEvaluator()
    const sampleRate = 16000
    const centroid = VOWEL_CENTROIDS['iː']
    const samples = synthesizeVowelSignal(sampleRate, 200, centroid.f1Hz, centroid.f2Hz)

    const result = await evaluator.evaluate({
      audio: { uri: 'mem://synthetic', durationMs: 200 },
      targetText: 'sheep',
      transcript: 'sheep',
      dimensions: ['segmental', 'wordStress'],
      samples,
      sampleRate,
      targetVowel: 'iː',
    } as never)

    const wordStress = result.dimensionScores.find((d) => d.dimension === 'wordStress')
    expect(wordStress?.abstained).toBe(true)
    expect(wordStress?.abstainReason).toBe('dimension_out_of_scope')
  })
})
