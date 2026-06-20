import { describe, it, expect } from 'vitest'
import { buildWordExercises } from '../word-exercise-builder'
import type { CoreWord } from '@/lib/core-1000/types'

const word: CoreWord = {
  rank: 1,
  word: 'house',
  pos: 'noun',
  ipa_strong: '/haʊs/',
  example_sentence: 'I live in a house on Maple Street.',
  cefr_level: 'A1',
}

describe('buildWordExercises', () => {
  it('produces one exercise per word', () => {
    expect(buildWordExercises([word])).toHaveLength(1)
  })

  it('produces a fill_blank with sourceRef.source = core1k', () => {
    const [ex] = buildWordExercises([word])
    expect(ex.type).toBe('fill_blank')
    expect(ex.sourceRef.source).toBe('core1k')
  })

  it('sourceRef.id is the c1k: prefixed word id', () => {
    const [ex] = buildWordExercises([word])
    expect(ex.sourceRef.id).toBe('c1k:house')
  })

  it('blanks the target word in the sentence', () => {
    const [ex] = buildWordExercises([word])
    expect(ex.type).toBe('fill_blank')
    if (ex.type === 'fill_blank') {
      expect(ex.sentence).toContain('___')
      expect(ex.answer.toLowerCase()).toBe('house')
    }
  })

  it('provides 4 options including the correct answer', () => {
    const words: CoreWord[] = [
      word,
      { ...word, rank: 2, word: 'water', example_sentence: 'Drink water every day.' },
      { ...word, rank: 3, word: 'eat', example_sentence: 'I eat breakfast at 8.' },
      { ...word, rank: 4, word: 'run', example_sentence: 'She can run fast.' },
    ]
    const [ex] = buildWordExercises(words)
    if (ex.type === 'fill_blank') {
      expect(ex.options).toHaveLength(4)
      expect(ex.options).toContain(ex.answer)
    }
  })

  it('returns [] for empty input', () => {
    expect(buildWordExercises([])).toEqual([])
  })
})
