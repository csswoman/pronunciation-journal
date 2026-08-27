// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { DailyPlanStatus, DailyStep } from '@/hooks/useDailyPlan'

type MockArc = { soundIpa: string; topicLabel: string; sessionWords: string[] }

const mockState = vi.hoisted(() => ({
  status: 'ready' as DailyPlanStatus,
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

vi.mock('../DailyLessonCard', () => ({
  default: ({ lesson }: { lesson: { title: string } | null }) => (
    <div>{lesson ? `Lesson: ${lesson.title}` : 'No lesson'}</div>
  ),
}))

vi.mock('../StudyTipDisclosure', () => ({
  default: () => <div>Study tip</div>,
}))

vi.mock('../ImmersionLogCard', () => ({
  ImmersionLogCard: () => <div>Immersion log</div>,
}))

vi.mock('@/components/practice/hub/RecommendedPracticeCard', () => ({
  default: () => <div>Recommended practice</div>,
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

  const lesson = {
    slug: 'weak-forms',
    title: 'Formas débiles',
    subtitle: 'Cómo suenan de verdad',
    body: 'Texto corto.',
  }

  it('shows the session hub by default — no auto-start into a step session', async () => {
    render(<DailyChecklist conceptLesson={lesson} />)
    expect(screen.queryByText('Step session')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sesión diaria' })).toBeInTheDocument()
    expect(await screen.findByText('Lesson: Formas débiles')).toBeInTheDocument()
    expect(screen.getByText('Study tip')).toBeInTheDocument()
  })

  it('no longer shows the routine preset selector or the "plan is on Home" card', () => {
    render(<DailyChecklist conceptLesson={lesson} />)
    expect(screen.queryByText(/Estructura de tu Sesión de Hoy/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Modo Silencioso/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Tu plan de pasos está en Inicio/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Ver plan del día/i })).not.toBeInTheDocument()
  })

  it('auto-starts the step named by initialStepId (e.g. from a notification link)', async () => {
    render(<DailyChecklist conceptLesson={null} initialStepId="s3" />)
    expect(await screen.findByText('Step session')).toBeInTheDocument()
  })

  it('shows the hub when the entry step cannot auto-start (concept/study_deck)', () => {
    mockState.steps = [makeStep({ id: 's1', kind: 'concept', title: 'Teoría' })]
    render(<DailyChecklist conceptLesson={null} />)
    expect(screen.queryByText('Step session')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sesión diaria' })).toBeInTheDocument()
  })

  it('shows the empty lesson state when there is no lesson today', () => {
    mockState.steps = []
    render(<DailyChecklist conceptLesson={null} />)
    expect(screen.queryByText('Step session')).not.toBeInTheDocument()
    expect(screen.getByText('No lesson')).toBeInTheDocument()
  })

  it('shows a retry action on error', () => {
    mockState.status = 'error'
    render(<DailyChecklist conceptLesson={null} />)
    expect(screen.getByText('No se pudo preparar tu plan.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})
