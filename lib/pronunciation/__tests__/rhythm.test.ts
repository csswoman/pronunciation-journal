import { describe, expect, it } from 'vitest'
import { analyzeSentenceRhythm } from '../rhythm'

describe('analyzeSentenceRhythm', () => {
  it('returns empty analysis for empty or whitespace sentences', () => {
    const res = analyzeSentenceRhythm('   ')
    expect(res.tokens).toHaveLength(0)
    expect(res.contentWordCount).toBe(0)
    expect(res.functionWordCount).toBe(0)
    expect(res.contentRatio).toBe(0)
  })

  it('correctly classifies content words and function words in a natural sentence', () => {
    // "I want to go to the supermarket."
    // Content: want, go, supermarket (3)
    // Function: I, to, to, the (4)
    const res = analyzeSentenceRhythm('I want to go to the supermarket.')

    expect(res.contentWordCount).toBe(3)
    expect(res.functionWordCount).toBe(4)
    expect(res.tokens).toHaveLength(7)

    const want = res.tokens[1]
    expect(want.word).toBe('want')
    expect(want.isContent).toBe(true)
    expect(want.stressTier).toBe('primary-beat')

    const to1 = res.tokens[2]
    expect(to1.word).toBe('to')
    expect(to1.isContent).toBe(false)
    expect(to1.isWeak).toBe(true)
    expect(to1.weakIpa).toBe('tə')

    const the = res.tokens[5]
    expect(the.word).toBe('the')
    expect(the.isContent).toBe(false)
    expect(the.weakIpa).toBe('ðə')

    const supermarket = res.tokens[6]
    expect(supermarket.word).toBe('supermarket')
    expect(supermarket.raw).toBe('supermarket.')
    expect(supermarket.isContent).toBe(true)
  })

  it('classifies negative contractions as stressed content words', () => {
    const res = analyzeSentenceRhythm("I can't go today.")
    const cant = res.tokens[1]
    expect(cant.word).toBe("can't")
    expect(cant.isContent).toBe(true)
    expect(cant.stressTier).toBe('primary-beat')
  })

  it('calculates the contentRatio accurately', () => {
    const res = analyzeSentenceRhythm('Cats eat fish.')
    expect(res.contentWordCount).toBe(3)
    expect(res.functionWordCount).toBe(0)
    expect(res.contentRatio).toBe(1.0)
  })
})
