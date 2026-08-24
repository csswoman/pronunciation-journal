// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DailyStepList from '../DailyStepList'
import type { DailyStep, DailyStepStatus } from '@/hooks/useDailyPlan'

const playUiCue = vi.fn()
vi.mock('@/lib/ui-sounds/cues', () => ({
  playUiCue: (...args: unknown[]) => playUiCue(...args),
}))

beforeEach(() => {
  playUiCue.mockClear()
})

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

describe('DailyStepList (collapseFutureSteps=true)', () => {
  it('renders the current step expanded and up to 2 pending steps compact, with a toggle for the rest', () => {
    const steps = [
      makeStep({ id: 's1', title: 'Repaso de palabras', subtitle: 'Afianza 6 palabras' }),
      makeStep({ id: 's2', title: 'Lectura', subtitle: 'Tus palabras recientes', estMinutes: 3 }),
      makeStep({ id: 's3', title: 'Práctica de sonido', subtitle: '4 ejercicios', estMinutes: 8 }),
      makeStep({ id: 's4', title: 'Estudia teoría', subtitle: 'Cómo estudiar', estMinutes: 5 }),
      makeStep({ id: 's5', title: 'Irregular past tense', subtitle: 'Grammar of the day', estMinutes: 2 }),
    ]
    render(
      <DailyStepList
        steps={steps}
        getStepStatus={statusMap({})}
        onStartStep={vi.fn()}
        collapseFutureSteps
      />,
    )

    // Current step: expanded (subtitle visible). Regex, not exact string —
    // the expanded row joins subtitle + stepMeta() into one text node
    // (e.g. "Afianza 6 palabras · 1 ejercicio · 5 min"), same as the
    // default-rendering tests above.
    expect(screen.getByText('Repaso de palabras')).toBeInTheDocument()
    expect(screen.getByText(/Afianza 6 palabras/)).toBeInTheDocument()
    expect(screen.getByText('Empieza aquí')).toBeInTheDocument()

    // Next 2 pending steps: compact (title + subtitle + time)
    expect(screen.getByText('Lectura')).toBeInTheDocument()
    expect(screen.getByText(/3 min/)).toBeInTheDocument()
    expect(screen.getByText('Tus palabras recientes')).toBeInTheDocument()

    expect(screen.getByText('Práctica de sonido')).toBeInTheDocument()
    expect(screen.getByText(/8 min/)).toBeInTheDocument()
    expect(screen.getByText('4 ejercicios')).toBeInTheDocument()

    // Remaining 2 steps hidden behind the toggle
    expect(screen.queryByText('Estudia teoría')).not.toBeInTheDocument()
    expect(screen.queryByText('Irregular past tense')).not.toBeInTheDocument()
    expect(screen.getByText('Ver 2 pasos más')).toBeInTheDocument()
  })

  it('reveals the remaining compact steps when the toggle is clicked', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const steps = [
      makeStep({ id: 's1', title: 'Repaso de palabras' }),
      makeStep({ id: 's2', title: 'Lectura', estMinutes: 3 }),
      makeStep({ id: 's3', title: 'Práctica de sonido', estMinutes: 8 }),
      makeStep({ id: 's4', title: 'Estudia teoría', estMinutes: 5 }),
    ]
    const { container } = render(
      <DailyStepList
        steps={steps}
        getStepStatus={statusMap({})}
        onStartStep={vi.fn()}
        collapseFutureSteps
      />,
    )

    expect(screen.queryByText('Estudia teoría')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText('Ver 1 paso más'))
    expect(playUiCue).toHaveBeenCalledWith('nav-open')
    expect(screen.getByText('Estudia teoría')).toBeInTheDocument()
    expect(screen.queryByText(/Ver \d+ más/)).not.toBeInTheDocument()

    const revealed = screen.getByText('Estudia teoría').closest('li')
    expect(revealed?.classList.contains('list-stagger')).toBe(true)
    expect(revealed?.style.getPropertyValue('--stagger-index')).toBe('0')
    // Previously visible compact rows stay un-staggered
    const alreadyVisible = screen.getByText('Lectura').closest('li')
    expect(alreadyVisible?.classList.contains('list-stagger')).toBe(false)
    expect(container.querySelectorAll('.list-stagger')).toHaveLength(1)
  })

  it('does not show the toggle when there are 2 or fewer pending steps beyond the current one', () => {
    const steps = [
      makeStep({ id: 's1', title: 'Repaso de palabras' }),
      makeStep({ id: 's2', title: 'Lectura' }),
      makeStep({ id: 's3', title: 'Práctica de sonido' }),
    ]
    render(
      <DailyStepList
        steps={steps}
        getStepStatus={statusMap({})}
        onStartStep={vi.fn()}
        collapseFutureSteps
      />,
    )
    expect(screen.queryByText(/Ver \d+ más/)).not.toBeInTheDocument()
  })

  it('renders done steps compact with a check, never hidden, and does not count them against the pending budget', () => {
    const steps = [
      makeStep({ id: 's1', title: 'Repaso de palabras', subtitle: 'Ya completado' }),
      makeStep({ id: 's2', title: 'Lectura' }),
      makeStep({ id: 's3', title: 'Práctica de sonido' }),
      makeStep({ id: 's4', title: 'Estudia teoría' }),
      makeStep({ id: 's5', title: 'Irregular past tense' }),
    ]
    render(
      <DailyStepList
        steps={steps}
        getStepStatus={statusMap({ s1: 'done' })}
        onStartStep={vi.fn()}
        collapseFutureSteps
      />,
    )

    // Done step: compact (title + "Hecho", no subtitle), always visible —
    // does not consume any of the 2-pending-visible budget.
    expect(screen.getByText('Repaso de palabras')).toBeInTheDocument()
    expect(screen.getByText('Hecho')).toBeInTheDocument()
    expect(screen.queryByText('Ya completado')).not.toBeInTheDocument()

    // Entry point moves to s2. s3 and s4 are the 2 pending steps shown
    // compact (full budget, unaffected by the done step). s5 is the only
    // one hidden behind the toggle.
    expect(screen.getByText('Lectura')).toBeInTheDocument()
    expect(screen.getByText('Práctica de sonido')).toBeInTheDocument()
    expect(screen.getByText('Estudia teoría')).toBeInTheDocument()
    expect(screen.queryByText('Irregular past tense')).not.toBeInTheDocument()
    expect(screen.getByText('Ver 1 paso más')).toBeInTheDocument()
  })
})

describe('DailyStepList step-complete tick', () => {
  it('applies success-pulse and plays the toggle cue when a step transitions to done', () => {
    const steps = [makeStep({ id: 's1' })]
    const { rerender } = render(
      <DailyStepList
        steps={steps}
        getStepStatus={statusMap({})}
        onStartStep={vi.fn()}
      />,
    )

    expect(screen.queryByText('Hecho')).not.toBeInTheDocument()

    rerender(
      <DailyStepList
        steps={steps}
        getStepStatus={statusMap({ s1: 'done' })}
        onStartStep={vi.fn()}
      />,
    )

    const badge = screen.getByText('Hecho').closest('span')
    expect(badge?.classList.contains('success-pulse')).toBe(true)
    expect(playUiCue).toHaveBeenCalledWith('toggle')
  })

  it('does not play the toggle cue on initial mount for already-done steps', () => {
    const steps = [makeStep({ id: 's1' })]
    render(
      <DailyStepList
        steps={steps}
        getStepStatus={statusMap({ s1: 'done' })}
        onStartStep={vi.fn()}
      />,
    )

    expect(playUiCue).not.toHaveBeenCalled()
  })
})
