import { describe, expect, it } from 'vitest'
import {
  detectIrregularPast,
  detectMissingPastEd,
  detectAmAgree,
  detectDoubleNegative,
  detectMissingThirdPersonS,
  detectIrregularPlural,
  detectMissingApostrophe,
} from '@/lib/journal/writing-hints/rules'

describe('detectIrregularPast', () => {
  it('flags "goed"', () => {
    const text = 'Yesterday I goed to the store.'
    const matches = detectIrregularPast(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe('goed')
    expect(matches[0].ruleId).toBe('irregular-past')
  })

  it('does not flag correct "went"', () => {
    expect(detectIrregularPast('Yesterday I went to the store.')).toHaveLength(0)
  })
})

describe('detectMissingPastEd', () => {
  it('flags a bare verb after "yesterday"', () => {
    const text = 'Yesterday I walk to school.'
    const matches = detectMissingPastEd(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe('walk')
  })

  it('does not flag when already past tense', () => {
    expect(detectMissingPastEd('Yesterday I walked to school.')).toHaveLength(0)
  })

  it('flags a bare verb after "last week"', () => {
    const text = 'Last week I visit my parents.'
    const matches = detectMissingPastEd(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe('visit')
  })
})

describe('detectAmAgree', () => {
  it('flags "I am agree"', () => {
    const text = 'I am agree with you.'
    const matches = detectAmAgree(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe('am agree')
  })

  it('does not flag "I agree"', () => {
    expect(detectAmAgree('I agree with you.')).toHaveLength(0)
  })
})

describe('detectDoubleNegative', () => {
  it('flags "don\'t have no"', () => {
    const text = "I don't have no money."
    const matches = detectDoubleNegative(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe("don't have no")
  })

  it('does not flag a single negative', () => {
    expect(detectDoubleNegative("I don't have money.")).toHaveLength(0)
  })
})

describe('detectMissingThirdPersonS', () => {
  it('flags "He go"', () => {
    const text = 'He go to work every day.'
    const matches = detectMissingThirdPersonS(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe('go')
  })

  it('does not flag "He goes"', () => {
    expect(detectMissingThirdPersonS('He goes to work every day.')).toHaveLength(0)
  })
})

describe('detectIrregularPlural', () => {
  it('flags "childs"', () => {
    const text = 'I have three childs.'
    const matches = detectIrregularPlural(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe('childs')
  })

  it('does not flag "children"', () => {
    expect(detectIrregularPlural('I have three children.')).toHaveLength(0)
  })
})

describe('detectMissingApostrophe', () => {
  it('flags "dont"', () => {
    const text = 'I dont know the answer.'
    const matches = detectMissingApostrophe(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe('dont')
  })

  it('does not flag "don\'t"', () => {
    expect(detectMissingApostrophe("I don't know the answer.")).toHaveLength(0)
  })
})
