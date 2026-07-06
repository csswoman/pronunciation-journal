import { describe, it, expect } from 'vitest'
import { passageEmbedsTargets } from '../refinement'

describe('passageEmbedsTargets', () => {
  it('rejects substring false positives', () => {
    // "cat" must NOT match inside "category"
    expect(passageEmbedsTargets('I study a category today.', ['cat'])).toBe(false)
  })

  it('matches on word boundary', () => {
    expect(passageEmbedsTargets('The cat sleeps.', ['cat'])).toBe(true)
  })

  it('matches phrases across whitespace and punctuation boundaries', () => {
    expect(passageEmbedsTargets('I need to take care of my dog.', ['take care'])).toBe(true)
  })

  it('matches targets next to apostrophes without substring false positives', () => {
    expect(passageEmbedsTargets("The dog's bowl is full.", ['dog'])).toBe(true)
    expect(passageEmbedsTargets('The watchdog barked.', ['dog'])).toBe(false)
  })

  it('normalizes target casing before matching', () => {
    expect(passageEmbedsTargets('She went home.', ['Go'])).toBe(true)
  })

  it('accepts regular inflected forms', () => {
    expect(passageEmbedsTargets('She stopped here.', ['stop'])).toBe(true)
    expect(passageEmbedsTargets('Two cities grew.', ['city'])).toBe(true)
  })

  it('accepts irregular forms via the table', () => {
    expect(passageEmbedsTargets('He went home.', ['go'])).toBe(true)
    expect(passageEmbedsTargets('The children played.', ['child'])).toBe(true)
  })

  it('passes when at least 60% of targets appear', () => {
    // 3 of 5 = 60%
    const p = 'The cat ran and the dog slept.'
    expect(passageEmbedsTargets(p, ['cat', 'run', 'dog', 'fish', 'bird'])).toBe(true)
  })

  it('fails below the 60% threshold', () => {
    // 2 of 5 = 40%
    const p = 'The cat ran.'
    expect(passageEmbedsTargets(p, ['cat', 'run', 'dog', 'fish', 'bird'])).toBe(false)
  })
})
