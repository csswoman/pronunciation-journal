// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import type { DailyStep } from '@/hooks/useDailyPlan'

const mockDailyPlanState = vi.hoisted(() => ({
  status: 'ready' as const,
  steps: [] as DailyStep[],
  getStepStatus: () => 'pending' as const,
  completedCount: 0,
  allDone: false,
  arc: { topicLabel: 'Verbos', soundIpa: 't', sessionWords: ['take'] },
  load: vi.fn(),
  markDone: vi.fn().mockResolvedValue(undefined),
  celebrate: vi.fn(),
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('@/hooks/useDailyPlan', () => ({
  useDailyPlan: () => ({
    status: mockDailyPlanState.status,
    steps: mockDailyPlanState.steps,
    getStepStatus: mockDailyPlanState.getStepStatus,
    completedCount: mockDailyPlanState.completedCount,
    allDone: mockDailyPlanState.allDone,
    arc: mockDailyPlanState.arc,
    load: mockDailyPlanState.load,
    markDone: mockDailyPlanState.markDone,
    celebrate: mockDailyPlanState.celebrate,
  }),
}))

vi.mock('@/components/daily/DailyStepSession', () => ({
  default: ({
    step,
    onComplete,
    onExit,
  }: {
    step: DailyStep
    onComplete: () => void
    onExit: () => void
  }) => (
    <div data-testid="step-session">
      <div>Step session: {step.title}</div>
      <button type="button" onClick={onComplete}>Complete step</button>
      <button type="button" onClick={onExit}>Exit step</button>
    </div>
  ),
}))

vi.mock('@/components/daily/SessionRecapCard', () => ({
  default: ({ onBackHome }: { onBackHome?: () => void }) => (
    <div data-testid="session-recap">
      <div>Recap card</div>
      <button type="button" onClick={onBackHome}>Volver al inicio</button>
    </div>
  ),
}))

vi.mock('@/components/home/HomeCommandGrid', () => ({
  default: ({
    onStartStep,
  }: {
    onStartStep?: (step: DailyStep) => void
  }) => (
    <div data-testid="home-command-grid">
      <div>Command grid</div>
      <button
        type="button"
        onClick={() => onStartStep?.(mockDailyPlanState.steps[0])}
      >
        Start from grid
      </button>
    </div>
  ),
}))

import HomeLayout from '../HomeLayout'

function makeStep(id: string, overrides: Partial<DailyStep> = {}): DailyStep {
  return {
    id,
    kind: 'word_review',
    title: `Step ${id}`,
    subtitle: 'Subtitle',
    icon: 'book',
    exercises: [{ id: `ex-${id}` } as DailyStep['exercises'][number]],
    estMinutes: 3,
    ...overrides,
  }
}

describe('HomeLayout (session takeover)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    mockDailyPlanState.steps = [
      makeStep('s1', { title: 'Paso 1' }),
      makeStep('s2', { title: 'Paso 2' }),
    ]
  })

  const dummyProps = {
    placementState: { hasPlacement: true, hasMeaningfulProgress: true },
    pronunciationDiagnosticState: { hasPronunciationDiagnostic: true },
    primaryAction: { label: 'Start', href: '/daily', variant: 'primary' as const },
  }

  it('renders HomeCommandGrid when session is idle', () => {
    render(<HomeLayout {...dummyProps} />)
    expect(screen.getByTestId('home-command-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('step-session')).not.toBeInTheDocument()
    expect(screen.queryByTestId('session-recap')).not.toBeInTheDocument()
  })

  it('swaps to DailyStepSession full-bleed when starting a step', async () => {
    render(<HomeLayout {...dummyProps} />)
    const startBtn = screen.getByRole('button', { name: 'Start from grid' })

    act(() => {
      startBtn.click()
    })

    expect(screen.queryByTestId('home-command-grid')).not.toBeInTheDocument()
    expect(await screen.findByTestId('step-session')).toBeInTheDocument()
    expect(screen.getByText('Step session: Paso 1')).toBeInTheDocument()
  })

  it('advances in place to the next pending step on step completion', async () => {
    render(<HomeLayout {...dummyProps} />)
    act(() => {
      screen.getByRole('button', { name: 'Start from grid' }).click()
    })

    const completeBtn = screen.getByRole('button', { name: 'Complete step' })
    await act(async () => {
      completeBtn.click()
    })

    expect(mockDailyPlanState.markDone).toHaveBeenCalledWith('s1')
    expect(screen.getByText('Step session: Paso 2')).toBeInTheDocument()
    expect(screen.queryByTestId('home-command-grid')).not.toBeInTheDocument()
  })

  it('transitions to SessionRecapCard on completing the last step, and returns to grid on back home', async () => {
    mockDailyPlanState.steps = [makeStep('s1', { title: 'Paso Único' })]
    render(<HomeLayout {...dummyProps} />)

    act(() => {
      screen.getByRole('button', { name: 'Start from grid' }).click()
    })

    const completeBtn = screen.getByRole('button', { name: 'Complete step' })
    await act(async () => {
      completeBtn.click()
    })

    expect(screen.queryByTestId('step-session')).not.toBeInTheDocument()
    expect(screen.getByTestId('session-recap')).toBeInTheDocument()

    // Clicking "Volver al inicio" returns to idle (HomeCommandGrid)
    act(() => {
      screen.getByRole('button', { name: 'Volver al inicio' }).click()
    })

    expect(screen.getByTestId('home-command-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('session-recap')).not.toBeInTheDocument()
  })

  it('exiting a step session returns to HomeCommandGrid in idle', () => {
    render(<HomeLayout {...dummyProps} />)
    act(() => {
      screen.getByRole('button', { name: 'Start from grid' }).click()
    })

    expect(screen.getByTestId('step-session')).toBeInTheDocument()

    act(() => {
      screen.getByRole('button', { name: 'Exit step' }).click()
    })

    expect(screen.getByTestId('home-command-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('step-session')).not.toBeInTheDocument()
  })
})
