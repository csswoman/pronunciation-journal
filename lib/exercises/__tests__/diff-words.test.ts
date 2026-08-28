import { describe, expect, it } from 'vitest'
import { diffWords } from '../diff-words'

describe('diffWords', () => {
  it('handles empty inputs', () => {
    expect(diffWords('', '')).toEqual({ originalDiff: [], modifiedDiff: [] })
    expect(diffWords('', 'hello world')).toEqual({
      originalDiff: [],
      modifiedDiff: [
        { text: 'hello', type: 'insert' },
        { text: 'world', type: 'insert' },
      ],
    })
    expect(diffWords('hello world', '')).toEqual({
      originalDiff: [
        { text: 'hello', type: 'delete' },
        { text: 'world', type: 'delete' },
      ],
      modifiedDiff: [],
    })
  })

  it('detects equal and changed words', () => {
    const { originalDiff, modifiedDiff } = diffWords('I go to school yesterday', 'I went to school yesterday')
    expect(originalDiff).toEqual([
      { text: 'I', type: 'equal' },
      { text: 'go', type: 'delete' },
      { text: 'to', type: 'equal' },
      { text: 'school', type: 'equal' },
      { text: 'yesterday', type: 'equal' },
    ])
    expect(modifiedDiff).toEqual([
      { text: 'I', type: 'equal' },
      { text: 'went', type: 'insert' },
      { text: 'to', type: 'equal' },
      { text: 'school', type: 'equal' },
      { text: 'yesterday', type: 'equal' },
    ])
  })
})
