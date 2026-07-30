// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DailyStepList from '../DailyStepList'
import type { DailyStep, DailyStepStatus } from '@/hooks/useDailyPlan'

function makeStep(overrides: Partial<DailyStep> = {}): DailyStep {
  return {
    kind: 'word_review',
    id: 'step-1',
    title: 'Repaso de palabras',
    subtitle: 'Afianza 6 palabras de tu léxico',
    icon: 'book',
    exercises: [{ id: 'ex-1' } as DailyStep['exercises'][number]],
    estMinutes: 5,
    ...overrides,
  }
}

function statusMap(map: Record<string, DailyStepStatus>) {
  return (stepId: string) => map[stepId] ?? 'pending'
}

describe('DailyStepList (default, collapseFutureSteps unset)', () => {
  it('renders every step fully expanded with title, subtitle, and meta', () => {
    const steps = [
      makeStep({ id: 's1', title: 'Repaso de palabras' }),
      makeStep({ id: 's2', title: 'Lectura', subtitle: 'Tus palabras recientes' }),
      makeStep({ id: 's3', title: 'Práctica de sonido', subtitle: '4 ejercicios' }),
    ]
    render(
      <DailyStepList
        steps={steps}
        getStepStatus={statusMap({})}
        onStartStep={vi.fn()}
      />,
    )

    expect(screen.getByText('Repaso de palabras')).toBeInTheDocument()
    expect(screen.getByText(/Afianza 6 palabras/)).toBeInTheDocument()
    expect(screen.getByText('Lectura')).toBeInTheDocument()
    expect(screen.getByText(/Tus palabras recientes/)).toBeInTheDocument()
    expect(screen.getByText('Práctica de sonido')).toBeInTheDocument()
    expect(screen.queryByText(/Ver \d+ más/)).not.toBeInTheDocument()
  })

  it('marks the first non-done step as the entry point ("Empieza aquí")', () => {
    const steps = [
      makeStep({ id: 's1', title: 'Repaso de palabras' }),
      makeStep({ id: 's2', title: 'Lectura' }),
    ]
    render(
      <DailyStepList
        steps={steps}
        getStepStatus={statusMap({})}
        onStartStep={vi.fn()}
      />,
    )
    expect(screen.getByText('Empieza aquí')).toBeInTheDocument()
  })
})
