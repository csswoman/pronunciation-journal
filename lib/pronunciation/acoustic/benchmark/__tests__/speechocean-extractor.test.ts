import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  extractSpeechoceanVowels,
  monosyllabicTargetVowel,
  parseWavScp,
} from '../speechocean-extractor'

describe('monosyllabicTargetVowel', () => {
  it('maps a clean single-vowel-nucleus word to its plan 071 IPA target', () => {
    expect(monosyllabicTargetVowel('IH0 T')).toBe('ɪ')
    expect(monosyllabicTargetVowel('W IY0')).toBe('iː')
    expect(monosyllabicTargetVowel('K AO0 L')).toBeNull() // AO not in v1 set
  })

  it('rejects multi-vowel (polysyllabic) words', () => {
    expect(monosyllabicTargetVowel('AH0 B IH1 L AH0 T IY0')).toBeNull()
  })

  it('rejects words with zero vowel phones', () => {
    expect(monosyllabicTargetVowel('S T')).toBeNull()
  })
})

describe('parseWavScp', () => {
  it('parses Kaldi-style wav.scp lines into utt id + relative path pairs', () => {
    const raw = '000010011\tWAVE/SPEAKER0001/000010011.WAV\n000010035\tWAVE/SPEAKER0001/000010035.WAV\n'
    const entries = parseWavScp(raw)
    expect(entries).toEqual([
      { uttId: '000010011', relativeWavPath: 'WAVE/SPEAKER0001/000010011.WAV' },
      { uttId: '000010035', relativeWavPath: 'WAVE/SPEAKER0001/000010035.WAV' },
    ])
  })
})

/** Builds a minimal valid 16-bit PCM mono WAV buffer of a given duration (silence is fine — extraction only needs duration/sampleRate, not spectral content). */
function buildSilentWav(sampleRate: number, durationMs: number): Buffer {
  const numSamples = Math.round((durationMs / 1000) * sampleRate)
  const dataSize = numSamples * 2
  const buffer = Buffer.alloc(44 + dataSize)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  return buffer
}

describe('extractSpeechoceanVowels', () => {
  let corpusRoot: string
  const sampleRate = 16000

  beforeAll(() => {
    corpusRoot = mkdtempSync(join(tmpdir(), 'speechocean-fixture-'))
    mkdirSync(join(corpusRoot, 'resource'), { recursive: true })
    mkdirSync(join(corpusRoot, 'train'), { recursive: true })
    mkdirSync(join(corpusRoot, 'WAVE', 'SPEAKER0001'), { recursive: true })
    mkdirSync(join(corpusRoot, 'WAVE', 'SPEAKER0002'), { recursive: true })

    // Multi-word utterance: WE(iː) CALL(AO, skip) IT(ɪ) BEAR(EH, skip) — 4-word sentence.
    // Single-word utterances: IT(ɪ), WE(iː).
    writeFileSync(
      join(corpusRoot, 'resource', 'scores-detail.json'),
      JSON.stringify({
        '000010011': {
          text: 'WE CALL IT BEAR',
          words: [
            { text: 'WE', 'ref-phones': 'W IY0', total: [10, 10, 10, 10, 10] },
            { text: 'CALL', 'ref-phones': 'K AO0 L', total: [10, 8, 10, 10, 8] },
            { text: 'IT', 'ref-phones': 'IH0 T', total: [10, 10, 10, 10, 10] },
            { text: 'BEAR', 'ref-phones': 'B EH0 R', total: [4.4, 7.6, 10, 3.6, 6.8] },
          ],
        },
        '000020001': {
          text: 'IT',
          words: [{ text: 'IT', 'ref-phones': 'IH0 T', total: [9, 8, 9, 10, 9] }],
        },
        '000020002': {
          text: 'WE',
          words: [{ text: 'WE', 'ref-phones': 'W IY0', total: [10, 10, 9, 10, 10] }],
        },
      })
    )

    writeFileSync(
      join(corpusRoot, 'train', 'wav.scp'),
      [
        '000010011\tWAVE/SPEAKER0001/000010011.WAV',
        '000020001\tWAVE/SPEAKER0002/000020001.WAV',
        '000020002\tWAVE/SPEAKER0002/000020002.WAV',
      ].join('\n')
    )
    writeFileSync(
      join(corpusRoot, 'train', 'utt2spk'),
      ['000010011\tSPEAKER0001', '000020001\tSPEAKER0002', '000020002\tSPEAKER0002'].join('\n')
    )

    writeFileSync(join(corpusRoot, 'WAVE', 'SPEAKER0001', '000010011.WAV'), buildSilentWav(sampleRate, 1400))
    writeFileSync(join(corpusRoot, 'WAVE', 'SPEAKER0002', '000020001.WAV'), buildSilentWav(sampleRate, 500))
    writeFileSync(join(corpusRoot, 'WAVE', 'SPEAKER0002', '000020002.WAV'), buildSilentWav(sampleRate, 400))
  })

  afterAll(() => {
    rmSync(corpusRoot, { recursive: true, force: true })
  })

  it('extracts a windowed item for every monosyllabic target-vowel word, including inside multi-word utterances', () => {
    const items = extractSpeechoceanVowels({ corpusRoot, splits: ['train'] })

    // From the 4-word utterance: WE->iː and IT->ɪ are kept (CALL/BEAR are out of the v1 set).
    // Plus the 2 single-word utterances (IT->ɪ, WE->iː). Total >= 4.
    expect(items.length).toBeGreaterThanOrEqual(4)

    const fromSentence = items.find((i) => i.clipFile.endsWith('000010011.WAV') && i.targetVowel === 'ɪ')
    expect(fromSentence).toBeDefined()
    expect(fromSentence?.windowStartMs).toBeGreaterThanOrEqual(0)
    expect(fromSentence?.windowEndMs).toBeGreaterThan(fromSentence?.windowStartMs ?? 0)
  })

  it('does not compute a window for single-word utterances — the whole clip already is the word', () => {
    const items = extractSpeechoceanVowels({ corpusRoot, splits: ['train'] })
    const singleWordItem = items.find((i) => i.clipFile.endsWith('000020001.WAV'))
    expect(singleWordItem?.windowStartMs).toBeUndefined()
    expect(singleWordItem?.windowEndMs).toBeUndefined()
  })

  it('maps ARPAbet vowel phones to plan 071 IPA targets and averages rater scores to 0-100', () => {
    const items = extractSpeechoceanVowels({ corpusRoot, splits: ['train'] })
    const itItem = items.find((i) => i.clipFile.endsWith('000020001.WAV'))

    expect(itItem?.targetVowel).toBe('ɪ')
    expect(itItem?.humanScore).toBe(90) // mean(9,8,9,10,9) = 9 -> *10
    expect(itItem?.speakerId).toBe('SPEAKER0002')
  })
})
