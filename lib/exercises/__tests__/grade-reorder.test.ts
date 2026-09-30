import { describe, it, expect } from 'vitest'
import { gradeReorder } from '@/lib/exercises/grade-reorder'

describe('gradeReorder', () => {
  it('accepts an exact match', () => {
    expect(gradeReorder('The cat sat down', 'The cat sat down')).toBe(true)
  })

  it('ignores capitalization differences', () => {
    expect(gradeReorder('the cat sat down', 'The cat sat down')).toBe(true)
  })

  it('ignores surrounding punctuation', () => {
    expect(gradeReorder('I am tired', 'I am tired.')).toBe(true)
    expect(gradeReorder('Are you ready', 'Are you ready?')).toBe(true)
  })

  it('ignores collapsed whitespace', () => {
    expect(gradeReorder('I  am   tired', 'I am tired')).toBe(true)
  })

  it('still rejects a genuinely wrong word order', () => {
    expect(gradeReorder('cat the sat down', 'The cat sat down')).toBe(false)
  })

  it('rejects missing or extra words', () => {
    expect(gradeReorder('the cat sat', 'The cat sat down')).toBe(false)
  })

  it('accepts alternative orders when answerSpec is provided', () => {
    const spec = { accept: ['{I am tired today.|Today I am tired.}'] }
    expect(gradeReorder('I am tired today', 'I am tired today', spec)).toBe(true)
    expect(gradeReorder('Today I am tired', 'I am tired today', spec)).toBe(true)
    expect(gradeReorder('tired am I today', 'I am tired today', spec)).toBe(false)
  })

  it('supports multi-word block tokens (reorder chunks)', () => {
    // E.g. tokens = ['The book', 'which I bought', 'is good']
    const placed = ['The book', 'which I bought', 'is good'].join(' ')
    expect(gradeReorder(placed, 'The book which I bought is good.')).toBe(true)
  })
})
