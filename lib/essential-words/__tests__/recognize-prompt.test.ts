import { describe, expect, it } from 'vitest'
import { isDiscriminatingGloss, recognizePromptFor } from '../recognize-prompt'
import type { EssentialWord } from '../types'

function entry(overrides: Partial<EssentialWord> = {}): EssentialWord {
  return {
    rank: 1,
    word: 'you',
    pos: 'pronoun',
    ipa_strong: '/juː/',
    example_sentence: 'Did you see that today?',
    cefr_level: 'A1',
    translation: 'tú',
    meaning: 'The person or people being spoken to.',
    ...overrides,
  }
}

function distractor(word: string): EssentialWord {
  return entry({ word, translation: word, example_sentence: `${word} is here.` })
}

describe('recognizePromptFor', () => {
  it('uses a discriminating cloze for pronouns when distractors allow it', () => {
    const prompt = recognizePromptFor(
      entry({ word: 'i', example_sentence: 'I am ready now.' }),
      [distractor('you'), distractor('we'), distractor('he')],
    )
    expect(prompt?.variant).toBe('cloze')
    expect(prompt?.prompt).toContain('___')
  })

  it('falls back to Spanish translation when cloze is ambiguous', () => {
    const prompt = recognizePromptFor(
      entry({ word: 'he', translation: 'él', example_sentence: 'He is happy today.' }),
      [
        entry({ word: 'she', translation: 'ella', example_sentence: 'She is happy today.' }),
        entry({ word: 'it', translation: 'ello', example_sentence: 'It is happy today.' }),
        entry({ word: 'we', translation: 'nosotros', example_sentence: 'We are happy today.' }),
      ],
    )
    expect(prompt).toEqual({
      instruction: 'Elige la palabra que significa esto',
      prompt: 'él',
      variant: 'translation',
    })
  })

  it('prefers Spanish translation for non-functional words', () => {
    const prompt = recognizePromptFor(
      entry({
        word: 'through',
        pos: 'preposition',
        example_sentence: 'We walked through the park.',
        translation: 'a través de',
      }),
      [],
      0,
      'recognize_translation',
    )
    expect(prompt?.variant).toBe('translation')
    expect(prompt?.prompt).toBe('a través de')
  })

  it('rejects ambiguous Spanish glosses shared by distractors', () => {
    expect(
      isDiscriminatingGloss(
        entry({ word: 'he', translation: 'él' }),
        [entry({ word: 'him', translation: 'él' })],
        'translation',
      ),
    ).toBe(false)
  })

  it('uses meaning when translation mode gloss is ambiguous but meaning is unique', () => {
    const prompt = recognizePromptFor(
      entry({
        word: 'he',
        translation: 'él',
        meaning: 'The male person previously mentioned.',
        example_sentence: 'He is happy today.',
      }),
      [entry({ word: 'him', translation: 'él', meaning: 'The male person receiving an action.' })],
      0,
      'recognize_translation',
    )
    expect(prompt?.variant).toBe('translation')
    expect(prompt?.prompt).toContain('male person')
  })
})
