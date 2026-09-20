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
  it('renders the real hub data without relying on masonry placeholders', () => {
    const { container } = render(
      <PracticeOptionsGrid
        recommendation={recommendation}
        essentialWordsDueCount={15}
        vocabLearnedCount={612}
        vocabTotalCount={1000}
        arc={undefined}
        hubData={hubData}
        immersionWatchedCount={3}
      />,
    )

    expect(container.textContent).toContain('112 tarjetas guardadas')
    expect(container.textContent).toContain('25 palabras tuyas')
    expect(container.textContent).toContain('Viajes')
    expect(container.querySelectorAll('.practice-hub__masonry-item')).toHaveLength(0)
  })
})
