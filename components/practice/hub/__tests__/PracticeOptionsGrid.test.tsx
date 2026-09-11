// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import PracticeOptionsGrid from '../PracticeOptionsGrid'
import type { RecommendedResult } from '@/lib/practice/practice-modes'
import type { PracticeHubData } from '@/lib/practice/hub-data-types'

const hubData: PracticeHubData = {
  recommended: { dueCount: 15, criticalCount: 4, retentionPct: 88, previewWords: ['receipt'] },
  decks: { deckCount: 4, cardCount: 112, topDeckNames: ['Viajes', 'Trabajo'] },
  reader: { recentWordCount: 25 },
  immersion: { totalCount: 12 },
  course: {
    levelId: 'b1',
    levelLabel: 'B1 · Intermedio',
    progressPct: 65,
    currentUnitTitle: 'Unidad 4',
    currentLessonTitle: 'Pasado simple',
  },
}

vi.mock('@/lib/db', () => ({
  setLastPracticeMode: vi.fn(),
}))
vi.mock('@/lib/stores/aiCoachStore', () => ({
  useAICoachStore: (selector: (s: unknown) => unknown) =>
    selector({ openCoach: vi.fn() }),
}))

const recommendation = {
  mode: { id: 'essential-words', href: '/practice/essential-words' },
  headline: '15 palabras esperan repaso',
  subtext: 'Repaso recomendado',
  reason: 'due-review',
} as unknown as RecommendedResult

describe('PracticeOptionsGrid', () => {
  it('renders each card wrapper with the expected data-span', () => {
    const { container } = render(
      <PracticeOptionsGrid
        recommendation={recommendation}
        dueCount={15}
        vocabLearnedCount={612}
        vocabTotalCount={1000}
        arc={undefined}
        hubData={hubData}
        immersionWatchedCount={3}
      />,
    )

    const spans = Array.from(
      container.querySelectorAll('.practice-hub__masonry-item'),
    ).map((el) => el.getAttribute('data-span'))

    // Order matches render order in the component.
    expect(spans).toEqual(['4', '1', '1', '2', '2', '2', '1', '1', '1', '1'])
  })
})
