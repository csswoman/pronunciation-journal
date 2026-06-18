import type { TestGalleryDomain } from '@/lib/practice/test-gallery/fixtures'
import type { PracticeContext } from '@/lib/practice/types'

export const CONTEXT_LABELS: Record<PracticeContext, string> = {
  daily: 'Daily',
  review: 'Review',
  practice: 'Practice',
  sound_lab: 'Sound Lab',
  courses: 'Courses',
  ai_coach: 'AI Coach',
  'core-1000': 'Core 1000',
}

export const DOMAIN_LABELS: Record<TestGalleryDomain, string> = {
  vocabulary: 'Vocabulario',
  pronunciation: 'Pronunciación',
  grammar: 'Gramática',
}

export const DOMAIN_ORDER: TestGalleryDomain[] = ['vocabulary', 'pronunciation', 'grammar']

/** Matches sidebar width — keep in sync with overlay offset (lg:right-72). */
export const TEST_SIDEBAR_CLASS = 'lg:w-72'
