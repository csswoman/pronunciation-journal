import { describe, it, expect } from 'vitest'
import { runBenchmarkOnItems } from '../run-benchmark'
import type { CorpusItem } from '../corpus-loader'

function synthesizeVowelSignal(sampleRate: number, durationMs: number, f1: number, f2: number): Float32Array {
  const numSamples = Math.round((durationMs / 1000) * sampleRate)
  const samples = new Float32Array(numSamples)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    samples[i] = (Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t)) / 2
  }
  return samples
}

describe('runBenchmarkOnItems', () => {
  it('runs the evaluator over provided items and returns metrics + verdicts', async () => {
    const sampleRate = 16000
    const items: CorpusItem[] = [
      { clipFile: 'a.wav', targetVowel: 'iː', humanScore: 90, speakerId: 's1' },
      { clipFile: 'b.wav', targetVowel: 'ɪ', humanScore: 85, speakerId: 's2' },
    ]
    // Injects pre-decoded audio directly, bypassing file I/O — keeps this
    // test hermetic and independent of any real corpus being present.
    const audioByFile: Record<string, { sampleRate: number; samples: Float32Array }> = {
      'a.wav': { sampleRate, samples: synthesizeVowelSignal(sampleRate, 200, 270, 2290) },
      'b.wav': { sampleRate, samples: synthesizeVowelSignal(sampleRate, 200, 400, 1990) },
    }

    const report = await runBenchmarkOnItems(items, (clipFile) => audioByFile[clipFile])

    expect(report.metrics.trialCount).toBe(2)
    expect(report.verdictsByVowel['iː']).toBeDefined()
    expect(report.verdictsByVowel['ɪ']).toBeDefined()
  })

  it('analyzes only the windowed region when windowStartMs/windowEndMs are set (Task 6b)', async () => {
    const sampleRate = 16000
    // Full clip: 100ms of silence (would abstain: low_snr), then 200ms of a
    // clean /iː/-like signal, then 100ms of silence again. Only a caller
    // that actually applies the window will see the vowel and score it.
    const silence = new Float32Array(Math.round(sampleRate * 0.1))
    const vowel = synthesizeVowelSignal(sampleRate, 200, 270, 2290)
    const fullClip = new Float32Array(silence.length + vowel.length + silence.length)
    fullClip.set(silence, 0)
    fullClip.set(vowel, silence.length)
    fullClip.set(silence, silence.length + vowel.length)

    const items: CorpusItem[] = [
      {
        clipFile: 'windowed.wav',
        targetVowel: 'iː',
        humanScore: 90,
        speakerId: 's1',
        windowStartMs: 100,
        windowEndMs: 300,
      },
    ]

    const report = await runBenchmarkOnItems(items, () => ({ sampleRate, samples: fullClip }))

    expect(report.metrics.abstentionRate).toBe(0)
    expect(report.metrics.perVowelAgreement['iː']).toBe(1)
  })
})
