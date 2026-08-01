import { describe, expect, it } from 'vitest'
import { generateFalseFriendExercises, hasGap } from '../false-friends'
import type { FalseFriend } from '@/lib/false-friends/types'

function entry(id: string, prompts = 2): FalseFriend {
  return {
    id,
    word: id,
    looksLike: 'x',
    actualMeaning: 'y',
    correctWord: 'z',
    kind: 'meaning-shift',
    cefr_level: 'B1',
    prompts: Array.from({ length: prompts }, (_, i) => ({
      sentence: `Prompt ${i} for ${id}: ___ here.`,
      options: [id, 'z'],
      answer: i % 2,
      explain: `explain ${i}`,
    })),
  }
}

describe('generateFalseFriendExercises', () => {
  it('produces one exercise per entry', () => {
    const result = generateFalseFriendExercises([entry('a'), entry('b')], 5)
    expect(result).toHaveLength(2)
  })

  it('respects the limit', () => {
    const result = generateFalseFriendExercises([entry('a'), entry('b'), entry('c')], 2)
    expect(result).toHaveLength(2)
  })

  it('maps to the multiple_choice generic type', () => {
    const [ex] = generateFalseFriendExercises([entry('a')], 1)
    expect(ex.type).toBe('multiple_choice')
    expect(ex.sourceRef).toEqual({ source: 'false_friends', id: 'a' })
  })

  it('keeps the authored answer index pointing at the right option', () => {
    const source = entry('a', 1)
    const [ex] = generateFalseFriendExercises([source], 1)
    expect(ex.options[ex.answerIndex]).toBe(source.prompts[0].options[source.prompts[0].answer])
  })

  it('carries the explanation through', () => {
    const [ex] = generateFalseFriendExercises([entry('a')], 1)
    expect(ex.explanation).toBe('explain 0')
  })

  it('namespaces topic so it does not collide with grammar topics', () => {
    const [ex] = generateFalseFriendExercises([entry('actually')], 1)
    expect(ex.topic).toBe('false_friend:actually')
  })

  it('rotates prompts by day so the other direction shows up later', () => {
    const [day0] = generateFalseFriendExercises([entry('a')], 1, 0)
    const [day1] = generateFalseFriendExercises([entry('a')], 1, 1)
    expect(day0.question).not.toBe(day1.question)
  })

  it('wraps rotation when the day exceeds the prompt count', () => {
    const [day0] = generateFalseFriendExercises([entry('a', 2)], 1, 0)
    const [day2] = generateFalseFriendExercises([entry('a', 2)], 1, 2)
    expect(day0.question).toBe(day2.question)
  })

  it('is deterministic: same input yields the same id', () => {
    const a = generateFalseFriendExercises([entry('a')], 1, 0)
    const b = generateFalseFriendExercises([entry('a')], 1, 0)
    expect(a[0].id).toBe(b[0].id)
  })

  it('gives different entries different ids', () => {
    const [a, b] = generateFalseFriendExercises([entry('a'), entry('b')], 2)
    expect(a.id).not.toBe(b.id)
  })

  it('skips entries with no prompts', () => {
    expect(generateFalseFriendExercises([entry('a', 0)], 3)).toHaveLength(0)
  })

  it('handles an empty bank', () => {
    expect(generateFalseFriendExercises([], 3)).toEqual([])
  })

  it('preserves the gap in the rendered question', () => {
    const [ex] = generateFalseFriendExercises([entry('a')], 1)
    expect(hasGap(ex.question)).toBe(true)
  })
})
