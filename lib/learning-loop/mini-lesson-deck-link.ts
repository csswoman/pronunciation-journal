import {
  findStudyByDeckSlug,
  studyOrPracticeDeckHref,
} from '@/lib/courses/curriculumIndex'
import { getDeckBySlug } from '@/lib/courses/grammar-deck/decks'
import { equivalentDeckSlugForMiniLesson } from '@/lib/learning-loop/theory-targets'

export interface MiniLessonDeckLink {
  href: string
  title: string
  viaRoute: boolean
}

/** Resolves Route/practice link for an equivalent mini-lesson deck, if any. */
export function resolveMiniLessonDeckLink(slug: string): MiniLessonDeckLink | null {
  const deckSlug = equivalentDeckSlugForMiniLesson(slug)
  if (!deckSlug) return null

  const study = findStudyByDeckSlug(deckSlug)
  const deck = getDeckBySlug(deckSlug)
  const title = study?.lesson.title ?? deck?.meta.title ?? deckSlug

  return {
    href: studyOrPracticeDeckHref(deckSlug),
    title,
    viaRoute: Boolean(study),
  }
}
