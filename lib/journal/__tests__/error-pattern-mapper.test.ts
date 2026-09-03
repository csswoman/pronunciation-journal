import { describe, it, expect } from 'vitest'
import { journalErrorToPatternId } from '../error-pattern-mapper'
import type { JournalError } from '../correction'

describe('journalErrorToPatternId', () => {
  it('maps past simple and tense errors to tense_present_for_past', () => {
    const err1: JournalError = {
      quote: 'I go yesterday',
      correction: 'I went yesterday',
      type: 'tense',
      explanationEs: 'Debes usar el pasado simple went.',
      topic: 'past-simple',
    }
    expect(journalErrorToPatternId(err1)).toBe('tense_present_for_past')
  })

  it('maps present perfect confusion to present_perfect_vs_past', () => {
    const err: JournalError = {
      quote: 'I have seen him yesterday',
      correction: 'I saw him yesterday',
      type: 'grammar',
      explanationEs: 'No uses present perfect con un punto de tiempo específico en el pasado.',
      topic: 'present-perfect',
    }
    expect(journalErrorToPatternId(err)).toBe('present_perfect_vs_past')
  })

  it('maps preposition errors to preposition_choice', () => {
    const err: JournalError = {
      quote: 'I arrived to London',
      correction: 'I arrived in London',
      type: 'preposition',
      explanationEs: 'Usa in con ciudades.',
      topic: 'prepositions',
    }
    expect(journalErrorToPatternId(err)).toBe('preposition_choice')
  })

  it('maps article errors to article_use', () => {
    const err: JournalError = {
      quote: 'She is doctor',
      correction: 'She is a doctor',
      type: 'article',
      explanationEs: 'Falta el artículo indefinido a.',
      topic: 'articles',
    }
    expect(journalErrorToPatternId(err)).toBe('article_use')
  })

  it('maps word order errors to word_order', () => {
    const err: JournalError = {
      quote: 'I like very much this book',
      correction: 'I like this book very much',
      type: 'word_order',
      explanationEs: 'El adverbio no debe separar el verbo de su objeto directo.',
      topic: 'word-order',
    }
    expect(journalErrorToPatternId(err)).toBe('word_order')
  })

  it('maps agreement errors to subject_verb_agreement', () => {
    const err: JournalError = {
      quote: 'He have two cars',
      correction: 'He has two cars',
      type: 'agreement',
      explanationEs: 'Tercera persona singular requiere has.',
      topic: 'subject-verb-agreement',
    }
    expect(journalErrorToPatternId(err)).toBe('subject_verb_agreement')
  })

  it('maps spelling errors to spelling', () => {
    const err: JournalError = {
      quote: 'beautifull',
      correction: 'beautiful',
      type: 'spelling',
      explanationEs: 'Se escribe con una sola l.',
      topic: 'spelling',
    }
    expect(journalErrorToPatternId(err)).toBe('spelling')
  })

  it('returns null for unknown or generic non-systematic topics', () => {
    const err: JournalError = {
      quote: 'Hello friend',
      correction: 'Hello my friend',
      type: 'style',
      explanationEs: 'Suena un poco más amistoso.',
      topic: 'conversational-style',
    }
    expect(journalErrorToPatternId(err)).toBeNull()
  })
})
