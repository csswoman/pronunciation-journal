// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const openCoach = vi.fn()

vi.mock('@/lib/stores/aiCoachStore', () => ({
  useAICoachStore: (selector: (s: { openCoach: typeof openCoach }) => unknown) =>
    selector({ openCoach }),
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}))

vi.mock('@/lib/tracking/queries', () => ({
  saveTrackedItem: vi.fn().mockResolvedValue(undefined),
}))

import DailyLessonCard from '../DailyLessonCard'

const lesson = {
  slug: 'weak-forms',
  title: 'Formas débiles',
  subtitle: 'Cómo suenan de verdad',
  body: 'Las palabras funcionales se reducen.',
}

describe('DailyLessonCard', () => {
  beforeEach(() => {
    openCoach.mockClear()
  })

  it('renders title, subtitle and body', () => {
    render(<DailyLessonCard lesson={lesson} />)
    expect(screen.getByRole('heading', { name: 'Formas débiles' })).toBeInTheDocument()
    expect(screen.getByText('Cómo suenan de verdad')).toBeInTheDocument()
    expect(screen.getByText('Las palabras funcionales se reducen.')).toBeInTheDocument()
  })

  it('links "Ver lección completa" to the mini-lesson slug', () => {
    render(<DailyLessonCard lesson={lesson} />)
    expect(
      screen.getByRole('link', { name: /Ver lección completa/i }),
    ).toHaveAttribute('href', '/mini-lessons/weak-forms')
  })

  it('opens the coach chat with a prefill about the lesson', async () => {
    render(<DailyLessonCard lesson={lesson} />)
    await userEvent.click(screen.getByRole('button', { name: /Pregúntale al coach/i }))
    expect(openCoach).toHaveBeenCalledWith({
      tab: 'chat',
      prefill: 'Explícame más sobre "Formas débiles"',
    })
  })

  it('shows the placeholder empty state when lesson is null', () => {
    render(<DailyLessonCard lesson={null} />)
    expect(screen.getByText('Hoy no hay lección nueva')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Ver lección completa/i })).not.toBeInTheDocument()
  })
})
