import { describe, it, expect } from 'vitest'
import {
  SILENT_LETTERS_DATA,
  silentLettersToConnectedPhrases,
} from '../silent-letters-data'
import { CONNECTED_SPEECH_DATA } from '../connected-speech-data'

describe('silent-letters-data', () => {
  it('contains valid silent letter items with required fields', () => {
    expect(SILENT_LETTERS_DATA.length).toBeGreaterThanOrEqual(15)

    for (const item of SILENT_LETTERS_DATA) {
      expect(item.id).toBeTruthy()
      expect(item.word).toBeTruthy()
      expect(item.silentLetter).toBeTruthy()
      expect(item.ipa).toMatch(/^\/.*\/$/)
      expect(item.meaningEs).toBeTruthy()
      expect(item.spanishTrapEs).toBeTruthy()
      expect(item.exampleSentence.toLowerCase()).toContain(item.word.toLowerCase())
    }
  })

  it('converts silent letter items to ConnectedPhrase format', () => {
    const phrases = silentLettersToConnectedPhrases()
    expect(phrases.length).toBe(SILENT_LETTERS_DATA.length)

    for (const p of phrases) {
      expect(p.category).toBe('silent-letters')
      expect(p.categoryNameEs).toBe('Letras Mudas (Silent Letters)')
      expect(p.phrase).toBeTruthy()
      expect(p.connectedIpa).toBeTruthy()
      expect(p.explanationEs).toBeTruthy()
    }
  })

  it('includes silent-letters category items in CONNECTED_SPEECH_DATA', () => {
    const silentPhrases = CONNECTED_SPEECH_DATA.filter((p) => p.category === 'silent-letters')
    expect(silentPhrases.length).toBeGreaterThanOrEqual(15)
  })
})
