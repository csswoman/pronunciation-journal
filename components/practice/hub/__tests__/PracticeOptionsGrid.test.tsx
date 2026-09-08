// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import PracticeOptionsGrid from '../PracticeOptionsGrid'
import type { RecommendedResult } from '@/lib/practice/practice-modes'

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
      />,
    )

    const spans = Array.from(
      container.querySelectorAll('.practice-hub__masonry-item'),
    ).map((el) => el.getAttribute('data-span'))

    // Order matches render order in the component.
    expect(spans).toEqual(['4', '1', '1', '2', '2', '2', '1', '1', '1', '1'])
  })
})
