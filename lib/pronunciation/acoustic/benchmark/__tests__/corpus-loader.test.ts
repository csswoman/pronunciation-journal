import { describe, it, expect } from 'vitest'
import { parseCorpusLabels, type CorpusItem } from '../corpus-loader'

describe('parseCorpusLabels', () => {
  it('parses a valid labels JSON into typed CorpusItem records', () => {
    const raw = JSON.stringify([
      { clipFile: 'utt001.wav', targetVowel: 'iː', humanScore: 92, speakerId: 'spk01' },
      { clipFile: 'utt002.wav', targetVowel: 'ɪ', humanScore: 45, speakerId: 'spk02' },
    ])

    const items = parseCorpusLabels(raw)

    expect(items).toHaveLength(2)
    expect(items[0]).toEqual<CorpusItem>({
      clipFile: 'utt001.wav',
      targetVowel: 'iː',
      humanScore: 92,
      speakerId: 'spk01',
    })
  })

  it('rejects malformed entries rather than silently dropping or coercing them', () => {
    const raw = JSON.stringify([{ clipFile: 'utt003.wav', targetVowel: 'iː' }]) // missing humanScore/speakerId

    expect(() => parseCorpusLabels(raw)).toThrow()
  })
})
