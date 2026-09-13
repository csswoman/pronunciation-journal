// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DailyOverviewSummary from '../DailyOverviewSummary'
import type { DailyStep } from '@/hooks/useDailyPlan'
import type { SessionArc } from '@/lib/practice/types'

function makeStep(overrides: Partial<DailyStep> = {}): DailyStep {
  return {
    kind: 'word_review',
    id: 's1',
    title: 'Palabras nuevas',
    subtitle: '5 palabras',
    icon: 'book',
    exercises: [{ id: 'ex-1' } as DailyStep['exercises'][number]],
    estMinutes: 3,
    ...overrides,
  }
}

function makeArc(partial: Partial<SessionArc>): SessionArc {
  return {
    topicLabel: null,
    soundIpa: null,
    sessionWords: [],
    ...partial,
  }
}

describe('DailyOverviewSummary', () => {
  const steps: DailyStep[] = [
    makeStep({ id: 's1', estMinutes: 5 }),
    makeStep({ id: 's2', estMinutes: 4 }),
  ]

  it('renders null when steps is empty', () => {
    const { container } = render(
      <DailyOverviewSummary
        steps={[]}
        getStepStatus={() => 'pending'}
        completedCount={0}
        arc={undefined}
        dueTomorrow={null}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('highlights the sound of the day prominently with the IPA badge', () => {
    render(
      <DailyOverviewSummary
        steps={steps}
        getStepStatus={() => 'pending'}
        completedCount={0}
        arc={makeArc({ soundIpa: 'k', topicLabel: 'Consonantes oclusivas' })}
        dueTomorrow={3}
      />,
    )

    // Prominent IPA badge
    expect(screen.getByLabelText(/Sonido del día \/k\//i)).toBeInTheDocument()
    expect(screen.getByText('Sonido del día')).toBeInTheDocument()
    expect(screen.getByText('Consonantes oclusivas')).toBeInTheDocument()
    expect(screen.getByText('Sonido /k/')).toBeInTheDocument()

    // Metrics
    expect(screen.getByText('0 / 2')).toBeInTheDocument()
    expect(screen.getByText('9 min')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('falls back gracefully when arc has no sound', () => {
    render(
      <DailyOverviewSummary
        steps={steps}
        getStepStatus={() => 'pending'}
        completedCount={1}
        arc={makeArc({ topicLabel: 'Gramática: Condicionales' })}
        dueTomorrow={0}
      />,
    )

    expect(screen.getByText('Foco de hoy')).toBeInTheDocument()
    expect(screen.getByText('Gramática: Condicionales')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Sonido del día/i)).not.toBeInTheDocument()
  })

  it('renders essential words progress bar when learned > 0', () => {
    render(
      <DailyOverviewSummary
        steps={steps}
        getStepStatus={() => 'pending'}
        completedCount={2}
        arc={makeArc({ soundIpa: 'i' })}
        dueTomorrow={1}
        learned={45}
      />,
    )

    expect(
      screen.getByRole('progressbar', { name: /Progreso de palabras esenciales/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByText('/ 1000')).toBeInTheDocument()
  })

  it('does not render essential words progress bar when learned is 0', () => {
    render(
      <DailyOverviewSummary
        steps={steps}
        getStepStatus={() => 'pending'}
        completedCount={0}
        arc={makeArc({ soundIpa: 'k' })}
        dueTomorrow={0}
        learned={0}
      />,
    )

    expect(
      screen.queryByRole('progressbar', { name: /Progreso de palabras esenciales/i }),
    ).not.toBeInTheDocument()
  })
})
