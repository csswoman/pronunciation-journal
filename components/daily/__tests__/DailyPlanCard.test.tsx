// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DailyPlanCard from '../DailyPlanCard'
import type { DailyStep, DailyStepStatus } from '@/hooks/useDailyPlan'

function makeStep(overrides: Partial<DailyStep> = {}): DailyStep {
  return {
    kind: 'word_review',
    id: 'step-1',
    title: 'Repaso de palabras',
    subtitle: 'Afianza 6 palabras de tu vocabulario',
    icon: 'book',
    exercises: [{ id: 'ex-1' } as DailyStep['exercises'][number]],
    estMinutes: 5,
    ...overrides,
  }
}

function statusMap(map: Record<string, DailyStepStatus>) {
  return (stepId: string) => map[stepId] ?? 'pending'
}

describe('DailyPlanCard', () => {
  it('shows loading skeleton copy when status is loading', () => {
    render(
      <DailyPlanCard
        status="loading"
        steps={[]}
        getStepStatus={statusMap({})}
        completedCount={0}
        allDone={false}
        onStartStep={vi.fn()}
        collapseFutureSteps
      />,
    )
    expect(screen.getByText('Preparando tu plan…')).toBeInTheDocument()
    expect(screen.getByLabelText('Plan de hoy')).toBeInTheDocument()
  })

  it('shows error + retry when status is error', async () => {
    const onRetry = vi.fn()
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(
      <DailyPlanCard
        status="error"
        steps={[]}
        getStepStatus={statusMap({})}
        completedCount={0}
        allDone={false}
        onStartStep={vi.fn()}
        onRetry={onRetry}
        collapseFutureSteps
      />,
    )
    expect(screen.getByText('No se pudo preparar tu plan.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders collapsed plan list with Plan de hoy label when ready', () => {
    const steps = [
      makeStep({ id: 's1', title: 'Palabras nuevas', estMinutes: 3 }),
      makeStep({ id: 's2', title: 'Repaso de palabras', estMinutes: 8 }),
      makeStep({ id: 's3', title: 'Práctica en contexto', estMinutes: 5 }),
      makeStep({ id: 's4', title: 'Estudia teoría', estMinutes: 5 }),
      makeStep({ id: 's5', title: 'Sentence stress', estMinutes: 2 }),
    ]
    render(
      <DailyPlanCard
        status="ready"
        steps={steps}
        getStepStatus={statusMap({})}
        completedCount={0}
        allDone={false}
        onStartStep={vi.fn()}
        collapseFutureSteps
      />,
    )
    expect(screen.getByText('Plan de hoy')).toBeInTheDocument()
    expect(screen.getByText('Palabras nuevas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\+ \d+ pasos? más/i })).toBeInTheDocument()
  })
})
