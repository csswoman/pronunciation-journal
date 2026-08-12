import { describe, it, expect } from 'vitest'
import { deriveSuggestedFocus } from '../derive-suggested-focus'

describe('deriveSuggestedFocus', () => {
  it('prefers assessment/profile CEFR over route', () => {
    const result = deriveSuggestedFocus({
      profileLevel: 'B1',
      routeLevel: 'a1',
      recentTheoryLessonSlug: 'articles-a-an-the',
      weakSoundKey: 'θ',
    })
    expect(result).toEqual({
      level: 'b1',
      thread: null,
      source: 'profile',
    })
  })

  it('uses route level when profile missing, with theory thread from recent practice', () => {
    const result = deriveSuggestedFocus({
      profileLevel: null,
      routeLevel: 'a2',
      recentTheoryLessonSlug: 'some-any',
      weakSoundKey: null,
    })
    expect(result).toEqual({
      level: 'a2',
      thread: { kind: 'theory', topicId: 'some-any' },
      source: 'route',
    })
  })

  it('falls back to a1 with weak sound thread', () => {
    const result = deriveSuggestedFocus({
      profileLevel: null,
      routeLevel: null,
      recentTheoryLessonSlug: null,
      weakSoundKey: 'ɪ',
    })
    expect(result.level).toBe('a1')
    expect(result.thread).toEqual({ kind: 'sound', key: 'ɪ' })
    expect(result.source).toBe('sound_weak')
  })
})
