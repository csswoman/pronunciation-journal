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
})
