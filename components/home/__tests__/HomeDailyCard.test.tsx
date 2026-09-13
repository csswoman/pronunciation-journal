// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomeDailyCard from '../HomeDailyCard'
import type { DailyPlanStatus, DailyStep } from '@/hooks/useDailyPlan'

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

function makeStep(id: string, overrides: Partial<DailyStep> = {}): DailyStep {
  return {
    id,
    kind: 'word_review',
    title: `Step ${id}`,
    subtitle: 'Practice words',
    icon: 'book',
    exercises: [{ id: `ex-${id}` } as DailyStep['exercises'][number]],
    estMinutes: 3,
    ...overrides,
  }
}

describe('HomeDailyCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('calls onStartStep when a step is clicked without calling router.push', () => {
    const s1 = makeStep('s1', { title: 'Repaso inicial' })
    const onStartStep = vi.fn()

    const mockPlanState = {
      plan: { steps: [s1] } as unknown as ReturnType<typeof import('@/hooks/useDailyPlan')['useDailyPlan']>['plan'],
      status: 'ready' as DailyPlanStatus,
      steps: [s1],
      getStepStatus: () => 'pending' as const,
      completedCount: 0,
      allDone: false,
      arc: undefined,
      load: vi.fn(),
      markDone: vi.fn(),
      celebrate: vi.fn(),
      doneIds: new Set<string>(),
      resolvedIds: new Set<string>(),
    }

    render(
      <HomeDailyCard
        conceptLesson={null}
        planState={mockPlanState}
        onStartStep={onStartStep}
      />,
    )

    const startButton = screen.getByRole('button', { name: /Empezar/i })
    startButton.click()

    expect(onStartStep).toHaveBeenCalledWith(expect.objectContaining({ id: 's1' }))
    expect(routerMock.push).not.toHaveBeenCalled()
  })

  it('does not invoke onStartStep for concept steps', () => {
    const conceptStep = makeStep('c1', {
      kind: 'concept',
      title: 'Concepto gramatical',
      exercises: [],
    })
    const onStartStep = vi.fn()

    const mockPlanState = {
      plan: { steps: [conceptStep] } as unknown as ReturnType<typeof import('@/hooks/useDailyPlan')['useDailyPlan']>['plan'],
      status: 'ready' as DailyPlanStatus,
      steps: [conceptStep],
      getStepStatus: () => 'pending' as const,
      completedCount: 0,
      allDone: false,
      arc: undefined,
      load: vi.fn(),
      markDone: vi.fn(),
      celebrate: vi.fn(),
      doneIds: new Set<string>(),
      resolvedIds: new Set<string>(),
    }

    render(
      <HomeDailyCard
        conceptLesson={null}
        planState={mockPlanState}
        onStartStep={onStartStep}
      />,
    )

    // Concept step does not trigger onStartStep
    const startButton = screen.getByRole('button', { name: /Empezar/i })
    startButton.click()

    expect(onStartStep).not.toHaveBeenCalled()
    expect(routerMock.push).not.toHaveBeenCalled()
  })

  it('notifies parent via onPlanStatusChange', () => {
    const s1 = makeStep('s1')
    const onPlanStatusChange = vi.fn()

    const mockPlanState = {
      plan: { steps: [s1] } as unknown as ReturnType<typeof import('@/hooks/useDailyPlan')['useDailyPlan']>['plan'],
      status: 'ready' as DailyPlanStatus,
      steps: [s1],
      getStepStatus: () => 'pending' as const,
      completedCount: 0,
      allDone: false,
      arc: undefined,
      load: vi.fn(),
      markDone: vi.fn(),
      celebrate: vi.fn(),
      doneIds: new Set<string>(),
      resolvedIds: new Set<string>(),
    }

    render(
      <HomeDailyCard
        conceptLesson={null}
        planState={mockPlanState}
        onPlanStatusChange={onPlanStatusChange}
      />,
    )

    expect(onPlanStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({
        settled: true,
        stepCount: 1,
        allDone: false,
      }),
    )
  })
})
