import { describe, it, expect } from 'vitest'
import { buildSession, selectNextExercise } from '../engine'
import type {
  ExerciseSlug,
  PracticeExercise,
  SessionResult,
} from '../types'

function makeExercise(
  id: string,
  slug: ExerciseSlug,
  contentId: string,
): PracticeExercise {
  return {
    id,
    slug,
    exerciseTypeId: 1,
    contentId,
    context: 'practice',
    payload: {
      kind: 'phoneme',
      ipa: 'iː',
      options: [],
      correctIds: [],
    },
  }
}

const noop = (_r: SessionResult) => {}

describe('buildSession', () => {
  it('respects sessionLength', () => {
    const exercises = Array.from({ length: 10 }, (_, i) =>
      makeExercise(`id-${i}`, i % 2 === 0 ? 'pick_word' : 'pick_sound', `c-${i}`),
    )
    const result = buildSession({
      context: 'practice',
      exercises,
      sessionLength: 5,
      onSessionComplete: noop,
    })
    expect(result).toHaveLength(5)
  })

  it('defaults to 5 when sessionLength is omitted', () => {
    const exercises = Array.from({ length: 8 }, (_, i) =>
      makeExercise(`id-${i}`, i % 2 === 0 ? 'pick_word' : 'dictation', `c-${i}`),
    )
    const result = buildSession({
      context: 'practice',
      exercises,
      onSessionComplete: noop,
    })
    expect(result).toHaveLength(5)
  })

  it('does not repeat contentId within the session', () => {
    const exercises = [
      makeExercise('a1', 'pick_word', 'shared'),
      makeExercise('a2', 'pick_sound', 'shared'),
      makeExercise('a3', 'dictation', 'shared'),
      makeExercise('a4', 'pick_word', 'unique-1'),
      makeExercise('a5', 'pick_sound', 'unique-2'),
    ]
    const result = buildSession({
      context: 'practice',
      exercises,
      sessionLength: 5,
      onSessionComplete: noop,
    })
    const contentIds = result.map((e) => e.contentId)
    expect(new Set(contentIds).size).toBe(contentIds.length)
  })

  it('does not repeat the same slug consecutively when alternatives exist', () => {
    // 4 distinct slugs with 2 items each → plenty of alternatives at every step.
    const exercises: PracticeExercise[] = [
      makeExercise('a1', 'pick_word', 'c1'),
      makeExercise('a2', 'pick_word', 'c2'),
      makeExercise('a3', 'pick_sound', 'c3'),
      makeExercise('a4', 'pick_sound', 'c4'),
      makeExercise('a5', 'dictation', 'c5'),
      makeExercise('a6', 'dictation', 'c6'),
      makeExercise('a7', 'minimal_pair', 'c7'),
      makeExercise('a8', 'minimal_pair', 'c8'),
    ]
    // Run many times to surface any non-deterministic repetition.
    for (let i = 0; i < 50; i++) {
      const result = buildSession({
        context: 'practice',
        exercises,
        sessionLength: 5,
        onSessionComplete: noop,
      })
      for (let j = 1; j < result.length; j++) {
        expect(result[j].slug).not.toBe(result[j - 1].slug)
      }
    }
  })

  it('returns what is available when fewer exercises than sessionLength', () => {
    const exercises = [
      makeExercise('a1', 'pick_word', 'c1'),
      makeExercise('a2', 'pick_sound', 'c2'),
    ]
    const result = buildSession({
      context: 'practice',
      exercises,
      sessionLength: 5,
      onSessionComplete: noop,
    })
    expect(result).toHaveLength(2)
  })
})

describe('selectNextExercise', () => {
  it('returns null when no exercises remain', () => {
    expect(selectNextExercise([], [])).toBeNull()
  })

  it('returns null when all exercises are completed', () => {
    const exercises = [
      makeExercise('a1', 'pick_word', 'c1'),
      makeExercise('a2', 'pick_sound', 'c2'),
    ]
    const completedIds = new Set(['a1', 'a2'])
    expect(selectNextExercise(exercises, ['pick_word', 'pick_sound'], completedIds)).toBeNull()
  })

  it('avoids the most recent slug when alternatives exist', () => {
    const exercises = [
      makeExercise('a1', 'pick_word', 'c1'),
      makeExercise('a2', 'pick_sound', 'c2'),
    ]
    for (let i = 0; i < 20; i++) {
      const next = selectNextExercise(exercises, ['pick_word'])
      expect(next?.slug).toBe('pick_sound')
    }
  })
})
