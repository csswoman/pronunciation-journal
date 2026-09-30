// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReviewCategoryGrid } from '../ReviewCategoryGrid'
import type { ReviewHubSummary } from '@/lib/review/types'

function buildSummary(overrides: Partial<ReviewHubSummary> = {}): ReviewHubSummary {
  return {
    failedSentences: [],
    weakWords: [],
    dueWords: [],
    soundsDue: [],
    dueTopics: [],
    weakTopics: [],
    dueLessons: [],
    essentialWordsDue: [],
    canStartReview: false,
    nothingDue: true,
    counts: {
      failedSentences: 0,
      weakWords: 0,
      dueWords: 0,
      soundsDue: 0,
      dueTopics: 0,
      weakTopics: 0,
      dueLessons: 0,
      essentialWordsDue: 0,
      executable: 0,
      elsewhere: 0,
      total: 0,
    },
    ...overrides,
  } as ReviewHubSummary
}

describe('ReviewCategoryGrid', () => {
  it('shows a real empty state and a real zero count instead of the debounce/aggregation mock words', () => {
    render(
      <ReviewCategoryGrid summary={buildSummary()} onStartSession={vi.fn()} />,
    )

    expect(screen.queryByText('debounce')).not.toBeInTheDocument()
    expect(screen.queryByText('asynchronous')).not.toBeInTheDocument()
    expect(screen.getByText('Ninguna palabra en aprendizaje — muy bien.')).toBeInTheDocument()
    expect(screen.getByText('Nada de vocabulario para hoy.')).toBeInTheDocument()
    // The weak-words and due-words count badges show the real 0, not the `|| 20` / `|| 25` fallback.
    expect(screen.getAllByText('Ver las 0')).toHaveLength(2)
  })

  it('shows real sound fallback text instead of the sheep/about/bed mock list when there are no sounds due', () => {
    render(
      <ReviewCategoryGrid summary={buildSummary()} onStartSession={vi.fn()} />,
    )

    expect(screen.queryByText('sheep')).not.toBeInTheDocument()
    expect(screen.getByText('Ningún sonido pendiente hoy.')).toBeInTheDocument()
  })

  it('calls onStartSession with the real category for each "Repasar grupo" button', () => {
    const onStartSession = vi.fn()
    const summary = buildSummary({
      weakWords: [{ id: 'w1', text: 'foo', srs_status: 'new' }] as unknown as ReviewHubSummary['weakWords'],
      dueWords: [{ id: 'w2', text: 'bar', srs_status: 'review' }] as unknown as ReviewHubSummary['dueWords'],
      soundsDue: [{ soundId: 1, ipa: 'i', example: 'x', daysOverdue: 1 }] as unknown as ReviewHubSummary['soundsDue'],
      counts: {
        failedSentences: 0, weakWords: 1, dueWords: 1, soundsDue: 1, dueTopics: 0, weakTopics: 0,
        dueLessons: 0, essentialWordsDue: 0, executable: 3, elsewhere: 0, total: 3,
      },
    })

    render(<ReviewCategoryGrid summary={summary} onStartSession={onStartSession} />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Repasar grupo' })[0])
    expect(onStartSession).toHaveBeenCalledWith('weak_words')

    fireEvent.click(screen.getAllByRole('button', { name: 'Repasar grupo' })[1])
    expect(onStartSession).toHaveBeenCalledWith('due_words')

    fireEvent.click(screen.getAllByRole('button', { name: 'Repasar grupo' })[2])
    expect(onStartSession).toHaveBeenCalledWith('sounds')
  })

  it('reflects real pending failed sentences and essential words in the linked-domains block', () => {
    const summary = buildSummary({
      failedSentences: [{ contentId: 'c1', label: 'x', typeLabel: 'y', drillable: true, phrase: null, wordBankId: null, slug: 'x', failedAt: '2026-01-01' }],
      essentialWordsDue: [{ id: 'e1', wordId: 'w', word: 'hello', skill: 'meaning', dueAt: '2026-01-01' }],
      counts: {
        failedSentences: 1, weakWords: 0, dueWords: 0, soundsDue: 0, dueTopics: 0, weakTopics: 0,
        dueLessons: 0, essentialWordsDue: 1, executable: 1, elsewhere: 1, total: 2,
      },
    })

    render(<ReviewCategoryGrid summary={summary} onStartSession={vi.fn()} />)

    expect(screen.getByText('TAMBIÉN PENDIENTE')).toBeInTheDocument()
    expect(screen.getByText('1 sin corregir')).toBeInTheDocument()
    expect(screen.getByText('1 pendientes')).toBeInTheDocument()
  })
})
