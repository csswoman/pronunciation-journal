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

describe('extractSpeechoceanVowels', () => {
  let corpusRoot: string

  beforeAll(() => {
    corpusRoot = mkdtempSync(join(tmpdir(), 'speechocean-fixture-'))
    mkdirSync(join(corpusRoot, 'resource'), { recursive: true })
    mkdirSync(join(corpusRoot, 'train'), { recursive: true })

    // Single-word utterance (IT -> IH0 T -> ɪ) should be kept.
    // Multi-word utterance (WE CALL IT BEAR) should be skipped (words.length !== 1).
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
  })

  afterAll(() => {
    rmSync(corpusRoot, { recursive: true, force: true })
  })

  it('keeps only single-word utterances whose vowel nucleus is in the v1 contrast set', () => {
    const items = extractSpeechoceanVowels({ corpusRoot, splits: ['train'] })

    expect(items).toHaveLength(2)
    expect(items.map((i) => i.clipFile).sort()).toEqual(
      ['WAVE/SPEAKER0002/000020001.WAV', 'WAVE/SPEAKER0002/000020002.WAV'].sort()
    )
  })

  it('maps ARPAbet vowel phones to plan 071 IPA targets and averages rater scores to 0-100', () => {
    const items = extractSpeechoceanVowels({ corpusRoot, splits: ['train'] })
    const itItem = items.find((i) => i.clipFile.endsWith('000020001.WAV'))

    expect(itItem?.targetVowel).toBe('ɪ')
    expect(itItem?.humanScore).toBe(90) // mean(9,8,9,10,9) = 9 -> *10
    expect(itItem?.speakerId).toBe('SPEAKER0002')
  })
})
