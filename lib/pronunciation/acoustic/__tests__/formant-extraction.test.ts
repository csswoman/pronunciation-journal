import { describe, it, expect } from 'vitest'
import { extractFormants } from '../formant-extraction'

/**
 * Synthesizes a test tone as a sum of sinusoids at known "formant" frequencies
 * plus a fundamental, at a fixed sample rate — stands in for a vowel's
 * resonance structure without needing real speech audio.
 */
function synthesizeFormantSignal(
  sampleRate: number,
  durationMs: number,
  formantHz: number[]
): Float32Array {
  const numSamples = Math.round((durationMs / 1000) * sampleRate)
  const samples = new Float32Array(numSamples)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    let value = 0
    for (const f of formantHz) {
      value += Math.sin(2 * Math.PI * f * t)
    }
    samples[i] = value / formantHz.length
  }
  return samples
}

describe('extractFormants', () => {
  it('recovers approximate F1/F2 from a synthetic two-formant signal', () => {
    const sampleRate = 16000
    // Typical /iː/-ish F1/F2 pair used only as a known-answer synthetic target.
    const signal = synthesizeFormantSignal(sampleRate, 200, [270, 2300])

    const result = extractFormants(signal, sampleRate)

    expect(result.abstained).toBe(false)
    expect(result.f1Hz).toBeGreaterThan(150)
    expect(result.f1Hz).toBeLessThan(450)
    expect(result.f2Hz).toBeGreaterThan(1900)
    expect(result.f2Hz).toBeLessThan(2700)
  })

  it('abstains on a clip shorter than the minimum analysis window', () => {
    const sampleRate = 16000
    const tooShort = new Float32Array(Math.round(sampleRate * 0.01)) // 10ms

    const result = extractFormants(tooShort, sampleRate)

    expect(result.abstained).toBe(true)
    expect(result.abstainReason).toBe('clip_too_short')
  })

  it('abstains on near-silent (low energy) audio', () => {
    const sampleRate = 16000
    const silence = new Float32Array(Math.round(sampleRate * 0.2)) // all zeros

    const result = extractFormants(silence, sampleRate)

    expect(result.abstained).toBe(true)
    expect(result.abstainReason).toBe('low_snr')
  })
})
