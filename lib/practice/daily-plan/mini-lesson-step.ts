import { MINI_LESSON_EQUIVALENT_DECKS, theoryTopicForDeck } from '@/lib/learning-loop/theory-targets'
import { deckSlugForTopic } from '@/lib/practice/topic-decks'
import type { DailyStep } from '@/lib/practice/types'

const MINI_LESSONS_COURSE_SLUG = 'mini-lessons'

/**
 * Offers today's weak grammar topic as a mini-lesson when one exists for it.
 * Only fires for topics with an authored deck equivalence (see
 * theory-targets.ts); text-matching a topic to a lesson is deliberately not
 * supported — the maintenance cost lives in the equivalence table, not here.
 */
export function buildMiniLessonStep(
  weakTopic: string | undefined,
  completedLessonIds: ReadonlySet<string>,
): DailyStep | null {
  if (!weakTopic) return null

  const deckSlug = deckSlugForTopic(weakTopic)
  if (!deckSlug) return null

  const slug = Object.entries(MINI_LESSON_EQUIVALENT_DECKS).find(
    ([, equivalentDeckSlug]) => equivalentDeckSlug === deckSlug,
  )?.[0]
  if (!slug) return null

  if (completedLessonIds.has(`${MINI_LESSONS_COURSE_SLUG}:${slug}`)) return null

  // reason/targetRefs are (re)assigned by the composer's candidate() mapping
  // (reasonForStep routes 'concept' -> 'route_next'; targetRefsForStep
  // special-cases the `mini_lesson:` id prefix to the shared theory topic so
  // this dedupes against a study_deck step already covering the same topic).
  return {
    kind: 'concept',
    id: `mini_lesson:${slug}`,
    title: 'Repasa la regla en una mini-lección',
    subtitle: 'Explicación corta con ejemplos, antes de seguir practicando',
    icon: 'BookOpen',
    exercises: [],
    estMinutes: 3,
    href: `/mini-lessons/${slug}`,
  }
}

/** Theory topic a `mini_lesson:<slug>` step id targets — used by targetRefsForStep. */
export function theoryTopicForMiniLessonStepId(stepId: string): string | null {
  const slug = stepId.startsWith('mini_lesson:') ? stepId.slice('mini_lesson:'.length) : null
  const deckSlug = slug ? MINI_LESSON_EQUIVALENT_DECKS[slug] : undefined
  return deckSlug ? theoryTopicForDeck(deckSlug) : null
}
