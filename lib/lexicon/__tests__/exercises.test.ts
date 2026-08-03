import { describe, expect, it } from 'vitest'
import type { WordEntry } from '@/lib/lexicon/types'
import {
  generateSentenceContextExercises,
  type SentenceContextSourceWord,
} from '../exercises'

function makeWordEntry(
  overrides: Partial<WordEntry> & { bankId?: string | null } = {},
): SentenceContextSourceWord {
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
    // Pool is padded so the only reason 'vague' is excluded is its missing
    // example sentence, not a shortage of distractors.
    const pool = [
      makeWordEntry({ id: '1', word: 'focus' }),
      makeWordEntry({ id: '2', word: 'vague', exampleSentence: undefined }),
      makeWordEntry({ id: '3', word: 'clarity' }),
      makeWordEntry({ id: '4', word: 'effort' }),
      makeWordEntry({ id: '5', word: 'patience' }),
    ]
    const exercises = generateSentenceContextExercises(pool, pool)
    expect(exercises.some((ex) => ex.answer === 'focus')).toBe(true)
    expect(exercises.every((ex) => ex.answer !== 'vague')).toBe(true)
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

  it('uses word_bank UUID for SRS when bankId is present, keeping catalog id on options', () => {
    const bankUuid = '550e8400-e29b-41d4-a716-446655440000'
    const pool = [
      makeWordEntry({ id: 'ship', word: 'ship', bankId: bankUuid, tags: ['t'] }),
      makeWordEntry({ id: 'a', word: 'boat', tags: ['t'] }),
      makeWordEntry({ id: 'b', word: 'car', tags: ['t'] }),
      makeWordEntry({ id: 'c', word: 'train', tags: ['t'] }),
    ]
    const [ex] = generateSentenceContextExercises([pool[0]], pool)
    expect(ex.sourceRef).toEqual({ source: 'word_bank', id: bankUuid })
    expect(ex.options.some((o) => o.id === 'ship')).toBe(true)
  })

  it('always emits four options when it emits an exercise', () => {
    const pool = [
      makeWordEntry({ id: 'ship', word: 'ship', tags: ['t'] }),
      makeWordEntry({ id: 'a', word: 'boat', tags: ['t'] }),
      makeWordEntry({ id: 'b', word: 'car', tags: ['t'] }),
      makeWordEntry({ id: 'c', word: 'train', tags: ['t'] }),
    ]
    for (const ex of generateSentenceContextExercises(pool, pool)) {
      expect(ex.options).toHaveLength(4)
    }
  })

  it('drops words whose pool cannot supply three distractors', () => {
    // Only two candidates besides the target — not enough for four options.
    const pool = [
      makeWordEntry({ id: 'ship', word: 'ship', tags: ['t'] }),
      makeWordEntry({ id: 'a', word: 'boat', tags: ['t'] }),
    ]
    expect(generateSentenceContextExercises(pool, pool)).toEqual([])
  })

  it('backfills distractors from outside the tag when same-tag words are scarce', () => {
    const pool = [
      makeWordEntry({ id: 'ship', word: 'ship', tags: ['transport'] }),
      makeWordEntry({ id: 'a', word: 'boat', tags: ['transport'] }),
      makeWordEntry({ id: 'b', word: 'apple', tags: ['food'] }),
      makeWordEntry({ id: 'c', word: 'bread', tags: ['food'] }),
    ]
    const [ex] = generateSentenceContextExercises([pool[0]], pool)
    expect(ex.options).toHaveLength(4)
  })

  it('never renders the same surface form twice in the options', () => {
    // Two distinct catalog ids share the spelling "boat".
    const pool = [
      makeWordEntry({ id: 'ship', word: 'ship', tags: ['t'] }),
      makeWordEntry({ id: 'a', word: 'boat', tags: ['t'] }),
      makeWordEntry({ id: 'a2', word: 'boat', tags: ['t'] }),
      makeWordEntry({ id: 'b', word: 'car', tags: ['t'] }),
      makeWordEntry({ id: 'c', word: 'train', tags: ['t'] }),
    ]
    for (let i = 0; i < 50; i++) {
      const [ex] = generateSentenceContextExercises([pool[0]], pool)
      if (!ex) continue
      const words = ex.options.map((o) => o.word)
      expect(new Set(words).size).toBe(words.length)
    }
  })

  it('never offers a distractor spelled like the answer', () => {
    // A different id carrying the answer's spelling must not become a choice.
    const pool = [
      makeWordEntry({ id: 'ship', word: 'ship', tags: ['t'] }),
      makeWordEntry({ id: 'dupe', word: 'Ship', tags: ['t'] }),
      makeWordEntry({ id: 'b', word: 'car', tags: ['t'] }),
      makeWordEntry({ id: 'c', word: 'train', tags: ['t'] }),
      makeWordEntry({ id: 'd', word: 'plane', tags: ['t'] }),
    ]
    for (let i = 0; i < 50; i++) {
      const [ex] = generateSentenceContextExercises([pool[0]], pool)
      if (!ex) continue
      const matching = ex.options.filter((o) => o.word.toLowerCase() === 'ship')
      expect(matching).toHaveLength(1)
    }
  })

  it('marks unsaved lexicon items as lexicon source (no bank UUID)', () => {
    const pool = [
      makeWordEntry({ id: 'ship', word: 'ship', tags: ['t'] }),
      makeWordEntry({ id: 'a', word: 'boat', tags: ['t'] }),
      makeWordEntry({ id: 'b', word: 'car', tags: ['t'] }),
      makeWordEntry({ id: 'c', word: 'train', tags: ['t'] }),
    ]
    const [ex] = generateSentenceContextExercises([pool[0]], pool)
    expect(ex.sourceRef).toEqual({ source: 'lexicon', id: 'ship' })
  })
})
