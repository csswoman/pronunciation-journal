// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ActivityHistoryCard } from '../ActivityHistoryCard'
import type { ActivitySessionSummary } from '@/lib/progress/activity-types'

describe('ActivityHistoryCard', () => {
  it('renders empty message when no sessions provided', () => {
    render(<ActivityHistoryCard sessions={[]} />)
    expect(
      screen.getByText('Completa una sesión para ver tu historial de actividad aquí.')
    ).toBeInTheDocument()
  })

  it('renders category distribution percentages and average accuracy', () => {
    const sessions: ActivitySessionSummary[] = [
      {
        id: 's1',
        source: 'daily_plan',
        sourceLabel: 'Plan Diario',
        skillTags: ['grammar'],
        exercisesTotal: 6,
        accuracyPct: 90,
        xpEarned: 50,
        completedAt: new Date().toISOString(),
      },
      {
        id: 's2',
        source: 'essential_words',
        sourceLabel: 'Vocabulario',
        skillTags: ['speaking'],
        exercisesTotal: 4,
        accuracyPct: 80,
        xpEarned: 30,
        completedAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ]

    render(<ActivityHistoryCard sessions={sessions} />)

    // Average accuracy: (90 + 80) / 2 = 85%
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('precisión promedio')).toBeInTheDocument()

    // Distribution: 6/10 = 60% Plan Diario, 4/10 = 40% Vocabulario
    expect(screen.getAllByText('Plan Diario').length).toBeGreaterThan(0)
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getAllByText('Vocabulario').length).toBeGreaterThan(0)
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  it('paginates list to 3 items per page and navigates with next/previous buttons', () => {
    const sessions: ActivitySessionSummary[] = Array.from({ length: 5 }, (_, i) => ({
      id: `session-id-${i + 1}`,
      source: 'daily_plan',
      sourceLabel: 'Plan Diario',
      skillTags: ['grammar'],
      exercisesTotal: 2,
      accuracyPct: 80 + i,
      xpEarned: 20,
      completedAt: new Date(Date.now() - i * 1000).toISOString(),
    }))

    render(<ActivityHistoryCard sessions={sessions} />)

    // Page 1 renders 3 items initially
    const itemsPage1 = screen.getAllByText(/8\d% precisión/i)
    expect(itemsPage1.length).toBe(3)
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()

    // Click next page button
    const nextBtn = screen.getByRole('button', { name: /Página siguiente/i })
    fireEvent.click(nextBtn)

    // Page 2 renders remaining 2 items
    const itemsPage2 = screen.getAllByText(/8\d% precisión/i)
    expect(itemsPage2.length).toBe(2)
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()
  })
})
