// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { DailyStep } from '@/hooks/useDailyPlan'

type MockArc = { soundIpa: string; topicLabel: string; sessionWords: string[] }

const mockState = vi.hoisted(() => ({
  status: 'ready' as const,
  steps: [] as DailyStep[],
  allDone: false,
  completedCount: 0,
  arc: undefined as MockArc | undefined,
  getStepStatus: () => 'pending' as const,
  load: vi.fn(),
  markDone: vi.fn(),
  celebrate: vi.fn(),
  plan: null as { arc?: MockArc } | null,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}))

vi.mock('@/hooks/useDailyPlan', () => ({
  useDailyPlan: () => ({
    plan: mockState.plan ?? { arc: mockState.arc },
    status: mockState.status,
    steps: mockState.steps,
    getStepStatus: mockState.getStepStatus,
    completedCount: mockState.completedCount,
    allDone: mockState.allDone,
    load: mockState.load,
    markDone: mockState.markDone,
    celebrate: mockState.celebrate,
  }),
}))

vi.mock('@/lib/review/client-queries', () => ({
  fetchDueTomorrowCount: vi.fn().mockResolvedValue(0),
}))

vi.mock('../DailyStepSession', () => ({
  default: () => <div>Step session</div>,
}))

vi.mock('../SessionRecapCard', () => ({
  default: () => <div>Recap</div>,
}))

vi.mock('../SessionOpeningBanner', () => ({
  default: () => <div>Opening banner</div>,
}))

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layout/PageHeader', () => ({
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}))

import DailyChecklist from '../DailyChecklist'

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

describe('DailyChecklist (checklist surface)', () => {
  beforeEach(() => {
    mockState.status = 'ready'
    mockState.allDone = false
    mockState.completedCount = 0
    mockState.steps = [
      makeStep({ id: 's1', title: 'Palabras nuevas' }),
      makeStep({ id: 's2', title: 'Repaso de palabras', estMinutes: 8 }),
      makeStep({ id: 's3', title: 'Práctica en contexto', estMinutes: 5 }),
      makeStep({ id: 's4', title: 'Estudia teoría', estMinutes: 5 }),
      makeStep({ id: 's5', title: 'Sentence stress', estMinutes: 2 }),
    ]
    mockState.arc = { soundIpa: 'h', topicLabel: 'aspiración', sessionWords: ['hello'] }
    mockState.plan = { arc: mockState.arc }
  })

  it('keeps page title and renders Home-style plan card (collapsed)', () => {
    render(<DailyChecklist conceptLesson={null} />)
    expect(screen.getByRole('heading', { name: 'Plan diario' })).toBeInTheDocument()
    expect(screen.getByLabelText('Plan de hoy')).toBeInTheDocument()
    expect(screen.getByText(/Ver \d+ más/)).toBeInTheDocument()
  })

  it('shows recommended practice card when arc is present', () => {
    render(<DailyChecklist conceptLesson={null} />)
    expect(screen.getByText(/Keep going with \/h\//)).toBeInTheDocument()
  })

  it('hides recommended practice card when arc is missing', () => {
    mockState.arc = undefined
    mockState.plan = { arc: undefined }
    render(<DailyChecklist conceptLesson={null} />)
    expect(screen.queryByText(/Keep going with/)).not.toBeInTheDocument()
    expect(screen.getByText(/Want free practice/)).toBeInTheDocument()
  })

  it('enters DailyStepSession when starting the entry step', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<DailyChecklist conceptLesson={null} />)
    expect(screen.queryByText('Step session')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Empieza aquí/i }))
    expect(screen.getByText('Step session')).toBeInTheDocument()
  })
})
