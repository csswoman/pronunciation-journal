import { describe, expect, it } from 'vitest'
import { isLikelySentence, tokenize } from '@/lib/exercises/utils'

describe('isLikelySentence', () => {
  it('accepts ordinary multi-word sentences', () => {
    expect(isLikelySentence('The cat sat on the mat.')).toBe(true)
    expect(isLikelySentence("I'm gonna call you later.")).toBe(true)
    expect(isLikelySentence('She walks to the shop')).toBe(true)
  })

  it('rejects transformation / mapping notation', () => {
    expect(isLikelySentence('going to → gonna')).toBe(false)
    expect(isLikelySentence('I am → I\'m')).toBe(false)
    expect(isLikelySentence('water → liquid → fluid → H₂O')).toBe(false)
    expect(isLikelySentence('By myself = solo')).toBe(false)
  })

  it('rejects slash alternation between alternatives', () => {
    expect(isLikelySentence('turn off / turn it off')).toBe(false)
    expect(isLikelySentence('So do I. / Me too.')).toBe(false)
  })

  it('rejects part-of-speech / stress notation', () => {
    expect(isLikelySentence('PREsent (n.) / preSENT (v.)')).toBe(false)
    expect(isLikelySentence('a REcord (n.) / to reCORD (v.)')).toBe(false)
  })

  it('rejects lone reduced forms and empty input', () => {
    expect(isLikelySentence('gonna')).toBe(false)
    expect(isLikelySentence('sorta')).toBe(false)
    expect(isLikelySentence('')).toBe(false)
    expect(isLikelySentence('   ')).toBe(false)
  })

  it('keeps sentences with hyphens and apostrophes', () => {
    expect(isLikelySentence("It's a well-known fact.")).toBe(true)
    expect(tokenize("It's a well-known fact.")).toHaveLength(4)
  })
})
