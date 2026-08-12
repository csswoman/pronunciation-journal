import { describe, expect, it } from 'vitest'
import { COURSE_PATH_CURRICULUM } from '@/lib/courses/curriculum'
import { getDeckBySlug } from '@/lib/courses/grammar-deck/decks'
import {
  findStudyByDeckSlug,
  studyOrPracticeDeckHref,
} from '@/lib/courses/curriculumIndex'
import {
  MINI_LESSON_EQUIVALENT_DECKS,
  equivalentDeckSlugForMiniLesson,
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
      expect(equivalentDeckSlugForMiniLesson(miniSlug)).toBe(deckSlug)
      expect(getDeckBySlug(deckSlug)).toBeTruthy()
    }
    expect(theoryTopicForMiniLesson('advanced-idioms')).toBe('mini:advanced idioms')
    expect(equivalentDeckSlugForMiniLesson('advanced-idioms')).toBeNull()
  })

  it('maps narrow A1 minis to their pattern-owner decks', () => {
    expect(equivalentDeckSlugForMiniLesson('countable-uncountable')).toBe(
      'a1-contables-incontables',
    )
    expect(equivalentDeckSlugForMiniLesson('frequency-adverbs')).toBe(
      'a1-adverbios-frecuencia',
    )
    expect(equivalentDeckSlugForMiniLesson('linking-words-basic')).toBe(
      'a1-conjunciones-basicas',
    )
  })

  it('prefers Route study href when the equivalent deck is on a path', () => {
    const deckSlug = 'a1-articulos-basicos'
    const study = findStudyByDeckSlug(deckSlug)
    expect(study).toBeTruthy()
    expect(studyOrPracticeDeckHref(deckSlug)).toBe(
      `/courses/study/${study!.lesson.number}?level=${study!.trackId}`,
    )
  })

  it('resolves mini-lesson deck CTA via Route when possible', async () => {
    const { resolveMiniLessonDeckLink } = await import(
      '@/lib/learning-loop/mini-lesson-deck-link'
    )
    const link = resolveMiniLessonDeckLink('articles-a-an-the')
    expect(link?.viaRoute).toBe(true)
    expect(link?.href).toMatch(/^\/courses\/study\/\d+\?level=a1$/)
  })
})
