import { describe, expect, it } from 'vitest'
import { dedupePrefixLines } from '../dedupe-prefix-lines'

describe('dedupePrefixLines', () => {
  it('collapses an interrupted sentence into its completed follow-up', () => {
    expect(
      dedupePrefixLines([
        'Today, I had a conversation with m.',
        'Today, I had a conversation with my husband.',
      ]),
    ).toEqual(['Today, I had a conversation with my husband.'])
  })

  it('leaves unrelated lines untouched', () => {
    const lines = ['Today I talked to my brother.', 'It was a good day.']
    expect(dedupePrefixLines(lines)).toEqual(lines)
  })

  it('only merges adjacent lines, not lines further apart', () => {
    const lines = ['I had a conversation with m.', 'It was a good day.', 'I had a conversation with my husband.']
    expect(dedupePrefixLines(lines)).toEqual(lines)
  })

  it('handles a single line', () => {
    expect(dedupePrefixLines(['Just one line.'])).toEqual(['Just one line.'])
  })

  it('handles an empty array', () => {
    expect(dedupePrefixLines([])).toEqual([])
  })
})
