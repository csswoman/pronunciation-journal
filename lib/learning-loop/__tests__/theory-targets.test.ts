import { describe, expect, it } from 'vitest'
import { COURSE_PATH_CURRICULUM } from '@/lib/courses/curriculum'
import { getDeckBySlug } from '@/lib/courses/grammar-deck/decks'
import {
  MINI_LESSON_EQUIVALENT_DECKS,
  theoryTopicForDeck,
  theoryTopicForMiniLesson,
} from '@/lib/learning-loop/theory-targets'

describe('canonical theory targets', () => {
  it('gives every authored Route lesson and deck the same topic', () => {
    const lessons = [...COURSE_PATH_CURRICULUM.levels, ...COURSE_PATH_CURRICULUM.electiveTracks]
      .flatMap((level) => level.units.flatMap((unit) => unit.lessons))
      .filter((lesson) => lesson.slug)
    for (const lesson of lessons) {
      expect(lesson.topicId).toBe(theoryTopicForDeck(lesson.slug!))
      expect(getDeckBySlug(lesson.slug!)?.topicId).toBe(lesson.topicId)
    }
  })

  it('shares topics only for explicit mini-lesson equivalences', () => {
    for (const [miniSlug, deckSlug] of Object.entries(MINI_LESSON_EQUIVALENT_DECKS)) {
      expect(theoryTopicForMiniLesson(miniSlug)).toBe(theoryTopicForDeck(deckSlug))
    }
    expect(theoryTopicForMiniLesson('advanced-idioms')).toBe('mini:advanced idioms')
  })
})
