import { describe, expect, it } from 'vitest'
import type { WordEntry } from '@/lib/lexicon/types'
import { generateSentenceContextExercises } from '../exercises'

function makeWordEntry(overrides: Partial<WordEntry> = {}): WordEntry {
  const id = overrides.id ?? 'w-1'
  const word = overrides.word ?? 'focus'
  return {
    id,
    word,
    pos: 'noun',
    definition: 'concentrated attention',
    difficulty: 2,
    tags: overrides.tags ?? ['productivity'],
    exampleSentence:
      overrides.exampleSentence ?? `She lost her ${word} during the long meeting today.`,
    ...overrides,
  }
}

describe('generateSentenceContextExercises', () => {
  it('skips words without an example sentence', () => {
    const pool = [
      makeWordEntry({ id: '1', word: 'focus' }),
      makeWordEntry({ id: '2', word: 'vague', exampleSentence: undefined }),
    ]
    const exercises = generateSentenceContextExercises(pool, pool)
    expect(exercises).toHaveLength(1)
    expect(exercises[0].answer).toBe('focus')
  })

  it('accepts inflected surface forms via blankLemma', () => {
    const pool = [
      makeWordEntry({
        id: 'work',
        word: 'work',
        exampleSentence: 'She works at a hospital downtown.',
        tags: ['jobs'],
      }),
      makeWordEntry({ id: 'a', word: 'walk', tags: ['jobs'] }),
      makeWordEntry({ id: 'b', word: 'swim', tags: ['jobs'] }),
      makeWordEntry({ id: 'c', word: 'jump', tags: ['jobs'] }),
    ]
    const exercises = generateSentenceContextExercises([pool[0]], pool)
    expect(exercises).toHaveLength(1)
    expect(exercises[0].sentence).toBe('She ___ at a hospital downtown.')
  })

  it('skips sentences without enough context after blanking', () => {
    const pool = [
      makeWordEntry({ id: '1', word: 'only', exampleSentence: 'The only item.' }),
      makeWordEntry({ id: '2', word: 'alpha', tags: ['x'] }),
      makeWordEntry({ id: '3', word: 'beta', tags: ['x'] }),
      makeWordEntry({ id: '4', word: 'gamma', tags: ['x'] }),
    ]
    const exercises = generateSentenceContextExercises(pool, pool)
    expect(exercises.every((ex) => ex.answer !== 'only')).toBe(true)
  })

  it('returns at most four exercises', () => {
    const pool = Array.from({ length: 8 }, (_, i) =>
      makeWordEntry({
        id: String(i),
        word: `term${i}`,
        exampleSentence: `The term${i} was very useful in class today.`,
        tags: ['set'],
      }),
    )
    expect(generateSentenceContextExercises(pool, pool)).toHaveLength(4)
  })

  it('never uses the answer as a distractor option', () => {
    const pool = Array.from({ length: 5 }, (_, i) =>
      makeWordEntry({
        id: String(i),
        word: `word${i}`,
        exampleSentence: `The word${i} was very useful in class today.`,
        tags: ['shared'],
      }),
    )
    for (const ex of generateSentenceContextExercises(pool, pool)) {
      const distractors = ex.options.filter((o) => o.word !== ex.answer)
      expect(distractors).toHaveLength(3)
      expect(distractors.every((o) => o.word !== ex.answer)).toBe(true)
    }
  })
})
