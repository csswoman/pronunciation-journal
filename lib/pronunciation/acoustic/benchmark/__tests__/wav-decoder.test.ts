import { describe, it, expect } from 'vitest'
import { decodeWavPcm16 } from '../wav-decoder'

/** Builds a minimal valid 16-bit PCM mono WAV buffer for round-trip testing. */
function buildTestWav(sampleRate: number, samples: number[]): Buffer {
  const dataSize = samples.length * 2
  const buffer = Buffer.alloc(44 + dataSize)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20) // PCM
  buffer.writeUInt16LE(1, 22) // mono
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  samples.forEach((s, i) => buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2))
  return buffer
}

describe('decodeWavPcm16', () => {
  it('decodes sample rate and normalized Float32 samples from a 16-bit PCM WAV', () => {
    const original = [0, 0.5, -0.5, 1, -1]
    const wav = buildTestWav(16000, original)

    const result = decodeWavPcm16(wav)

    expect(result.sampleRate).toBe(16000)
    expect(result.samples).toHaveLength(5)
    expect(result.samples[1]).toBeCloseTo(0.5, 1)
    expect(result.samples[2]).toBeCloseTo(-0.5, 1)
  })

  it('throws on a non-WAV buffer instead of returning garbage', () => {
    const notWav = Buffer.from('not a wav file')
    expect(() => decodeWavPcm16(notWav)).toThrow()
  })
})
