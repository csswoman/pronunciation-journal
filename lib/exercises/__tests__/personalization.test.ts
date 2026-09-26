import { describe, expect, it } from 'vitest'
import { gradePersonalization } from '../personalization'
import type { PersonalizationExercise } from '../types'

describe('gradePersonalization', () => {
  it('handles frame slot="number" with digits and words', () => {
    const ex: PersonalizationExercise = {
      id: 'p-1',
      type: 'personalization',
      mode: 'frame',
      frame: "I am ___ years old.",
      slot: 'number',
      sourceRef: { source: 'grammar_deck', id: 'deck-1' },
    }

    expect(gradePersonalization(ex, '28').ok).toBe(true)
    expect(gradePersonalization(ex, 'twenty-eight').ok).toBe(true)
    expect(gradePersonalization(ex, 'twenty eight').ok).toBe(true)

    const invalid = gradePersonalization(ex, 'young')
    expect(invalid.ok).toBe(false)
    expect(invalid.issues[0]).toMatch(/número/)
  })

  it('handles frame slot="word" and slot="phrase"', () => {
    const wordEx: PersonalizationExercise = {
      id: 'p-2',
      type: 'personalization',
      mode: 'frame',
      frame: "My favorite color is ___.",
      slot: 'word',
      sourceRef: { source: 'grammar_deck', id: 'deck-1' },
    }

    expect(gradePersonalization(wordEx, 'blue').ok).toBe(true)
    const tooMany = gradePersonalization(wordEx, 'very bright blue')
    expect(tooMany.ok).toBe(false)
    expect(tooMany.issues[0]).toMatch(/una sola palabra/)

    const phraseEx: PersonalizationExercise = {
      id: 'p-3',
      type: 'personalization',
      mode: 'frame',
      frame: "In my free time, I love ___.",
      slot: 'phrase',
      sourceRef: { source: 'grammar_deck', id: 'deck-1' },
    }

    expect(gradePersonalization(phraseEx, 'reading fantasy books').ok).toBe(true)
    const tooLong = gradePersonalization(
      phraseEx,
      'one two three four five six seven eight nine ten',
    )
    expect(tooLong.ok).toBe(false)
    expect(tooLong.issues[0]).toMatch(/máximo 8 palabras/)
  })

  it('rejects empty input', () => {
    const ex: PersonalizationExercise = {
      id: 'p-4',
      type: 'personalization',
      mode: 'frame',
      frame: "I am ___.",
      slot: 'word',
      sourceRef: { source: 'grammar_deck', id: 'deck-1' },
    }
    expect(gradePersonalization(ex, '   ').ok).toBe(false)
  })

  it('validates frame with requires structure check', () => {
    const ex: PersonalizationExercise = {
      id: 'p-5',
      type: 'personalization',
      mode: 'frame',
      frame: "Last weekend, I ___.",
      slot: 'phrase',
      requires: ['past_simple'],
      sourceRef: { source: 'grammar_deck', id: 'deck-1' },
    }

    const valid = gradePersonalization(ex, 'visited my grandparents')
    expect(valid.ok).toBe(true)
    expect(valid.assembledSentence).toBe('Last weekend, I visited my grandparents.')

    const invalid = gradePersonalization(ex, 'watch television')
    expect(invalid.ok).toBe(false)
    expect(invalid.issues[0]).toMatch(/estructura/)
  })

  it('validates open mode with word limits and required structures including contractions', () => {
    const openEx: PersonalizationExercise = {
      id: 'p-6',
      type: 'personalization',
      mode: 'open',
      promptEs: 'Describe un viaje que hayas hecho usando present perfect.',
      requires: ['present_perfect'],
      minWords: 5,
      maxWords: 15,
      sourceRef: { source: 'grammar_deck', id: 'deck-1' },
    }

    // Valid: 7 words, uses "I've been"
    const valid = gradePersonalization(openEx, "I've been to London two times already.")
    expect(valid.ok).toBe(true)

    // Too short: 3 words
    const short = gradePersonalization(openEx, "I've been there.")
    expect(short.ok).toBe(false)
    expect(short.issues[0]).toMatch(/al menos 5 palabras/)

    // Missing structure: 7 words, only past simple
    const noStruct = gradePersonalization(openEx, 'I went to London with my family.')
    expect(noStruct.ok).toBe(false)
    expect(noStruct.issues[0]).toMatch(/estructura/)
  })

  it('emits soft warning when "a" is followed by a vowel', () => {
    const ex: PersonalizationExercise = {
      id: 'p-7',
      type: 'personalization',
      mode: 'frame',
      frame: "Yesterday I bought ___.",
      slot: 'phrase',
      sourceRef: { source: 'grammar_deck', id: 'deck-1' },
    }

    const res = gradePersonalization(ex, 'a apple')
    expect(res.ok).toBe(true) // Doesn't fail
    expect(res.hints.some((h) => h.includes('"an"'))).toBe(true)
  })
})
