import { describe, expect, it } from 'vitest'
import {
  hasRecognizeClozeCandidate,
  isDiscriminatingRecognizeCloze,
  syntacticClozeConstraint,
} from '../recognize-cloze'
import type { EssentialWord } from '../types'

function entry(overrides: Partial<EssentialWord> = {}): EssentialWord {
  return {
    rank: 1,
    word: 'i',
    pos: 'pronoun',
    ipa_strong: '/aɪ/',
    example_sentence: 'I am ready now.',
    cefr_level: 'A1',
    translation: 'yo',
    ...overrides,
  }
}

function distractor(word: string, pos: EssentialWord['pos'] = 'pronoun'): EssentialWord {
  return entry({ word, pos, translation: word, example_sentence: `${word} is here.` })
}

describe('syntacticClozeConstraint', () => {
  it('allows only I before am', () => {
    expect(syntacticClozeConstraint('___ am ready now.')).toEqual({
      kind: 'allowed',
      words: ['i'],
    })
  })

  it('flags modal continuations as ambiguous', () => {
    expect(syntacticClozeConstraint('___ can help me.')).toEqual({ kind: 'ambiguous' })
  })
})

describe('isDiscriminatingRecognizeCloze', () => {
  it('accepts I when distractors do not fit am', () => {
    expect(
      isDiscriminatingRecognizeCloze(
        entry(),
        'I am ready now.',
        [distractor('you'), distractor('we'), distractor('he')],
      ),
    ).toBe(true)
  })

  it('rejects he when she and it are also in the pool', () => {
    expect(
      isDiscriminatingRecognizeCloze(
        entry({ word: 'he', example_sentence: 'He is happy today.' }),
        'He is happy today.',
        [distractor('she'), distractor('it'), distractor('we')],
      ),
    ).toBe(false)
  })
})

describe('hasRecognizeClozeCandidate', () => {
  it('is true for functional words with a tight agreement slot', () => {
    expect(hasRecognizeClozeCandidate(entry())).toBe(true)
  })

  it('is false for open-class words', () => {
    expect(
      hasRecognizeClozeCandidate(entry({
        word: 'happy',
        pos: 'adjective',
        example_sentence: 'I feel happy today.',
      })),
    ).toBe(false)
  })
})
