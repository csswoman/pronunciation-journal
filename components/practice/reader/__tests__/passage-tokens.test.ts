import { describe, expect, it } from 'vitest'
import { tokenizePassage } from '../passage-tokens'

describe('tokenizePassage', () => {
  it('preserves punctuation and associates words with their sentence', () => {
    const tokens = tokenizePassage("Hello, O'Neill! Re-use words — twice.")
    expect(tokens.map((token) => token.value).join('')).toBe("Hello, O'Neill! Re-use words — twice.")
    expect(tokens.filter((token) => token.kind === 'word')).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: "O'Neill", lookup: "o'neill", context: "Hello, O'Neill!" }),
      expect.objectContaining({ value: 'Re-use', lookup: 're-use', context: 'Re-use words — twice.' }),
    ]))
  })
})
