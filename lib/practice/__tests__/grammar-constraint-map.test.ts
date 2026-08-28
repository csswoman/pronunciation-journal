import { describe, it, expect } from 'vitest'
import { constraintIdForDeck } from '@/lib/practice/grammar-constraint-map'
import { constraintById } from '@/lib/exercises/speech-constraints'

describe('constraintIdForDeck', () => {
  it('maps a past-tense deck to the past narrative constraint', () => {
    expect(constraintIdForDeck('a2-experiencias-pasadas-planes')).toBe('past_simple_narrative')
  })

  it('maps the present perfect deck to the present perfect constraint', () => {
    expect(constraintIdForDeck('a2-presente-perfecto-experiencias'))
      .toBe('present_perfect_experience')
  })

  it('maps the second conditional deck to the hypothesis constraint', () => {
    expect(constraintIdForDeck('b1-segundo-condicional')).toBe('second_conditional')
  })

  it('returns null for a deck with no natural constraint', () => {
    expect(constraintIdForDeck('a1-alfabeto-deletreo')).toBeNull()
  })

  it('maps the gerunds/infinitives deck to the opinion constraint', () => {
    expect(constraintIdForDeck('b1-gerundios-infinitivos')).toBe('opinion_connector')
  })

  it('leaves passive voice, reported speech, relative clauses, and phrasal verbs unmapped', () => {
    expect(constraintIdForDeck('b1-voz-pasiva-consejos')).toBeNull()
    expect(constraintIdForDeck('b1-estilo-indirecto')).toBeNull()
    expect(constraintIdForDeck('b1-pronombres-clausulas-relativas')).toBeNull()
    expect(constraintIdForDeck('b1-phrasal-verbs-tipos')).toBeNull()
  })

  it('prioritizes the more specific comparativ fragment over planes-futuros', () => {
    expect(constraintIdForDeck('b1-comparativos-planes-futuros')).toBe('comparison')
  })

  it('only ever names constraints that exist', () => {
    const decks = [
      'a2-experiencias-pasadas-planes',
      'a2-presente-perfecto-experiencias',
      'b1-segundo-condicional',
      'a2-will-going-to',
      'b1-comparativos-planes-futuros',
      'b1-conectores-discurso',
      'a2-pasado-continuo',
    ]
    for (const deck of decks) {
      const id = constraintIdForDeck(deck)
      expect(id, `no constraint for ${deck}`).not.toBeNull()
      expect(constraintById(id!), `unknown constraint ${id}`).not.toBeNull()
    }
  })
})
