// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePlanDone from '@/components/home/HomePlanDone'

vi.mock('@/lib/db', () => ({
  setLastPracticeMode: vi.fn(),
}))

vi.mock('@/lib/stores/aiCoachStore', () => ({
  useAICoachStore: (selector: (s: { openCoach: () => void }) => unknown) =>
    selector({ openCoach: vi.fn() }),
}))

describe('HomePlanDone', () => {
  const arc = {
    soundIpa: 'æ',
    topicLabel: 'Food',
    sessionWords: ['apple', 'bag'],
  }

  it('celebrates completion and shows streak', () => {
    render(<HomePlanDone stepCount={5} arc={arc} streak={3} />)
    expect(screen.getByText('¡Plan completo!')).toBeInTheDocument()
    expect(screen.getByText(/3 días seguidos/i)).toBeInTheDocument()
    expect(screen.getByText('Practica en voz alta')).toBeInTheDocument()
  })

  it('shows a single Spanish free-practice recommendation from the arc sound', () => {
    render(<HomePlanDone stepCount={5} arc={arc} streak={1} />)
    expect(screen.getByText('Sigue con /æ/')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sigue con/i })).toHaveAttribute(
      'href',
      '/practice/sounds',
    )
  })

  it('nudges first streak day when streak is zero', () => {
    render(<HomePlanDone stepCount={5} arc={undefined} streak={0} />)
    expect(screen.getByText(/primer día de racha/i)).toBeInTheDocument()
    expect(screen.getByText('Sigue con palabras esenciales')).toBeInTheDocument()
  })
})

