// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SpeakWithCoachCard from '../SpeakWithCoachCard'

const openCoach = vi.fn()
vi.mock('@/lib/stores/aiCoachStore', () => ({
  useAICoachStore: (selector: (s: { openCoach: typeof openCoach }) => unknown) =>
    selector({ openCoach }),
}))

describe('SpeakWithCoachCard', () => {
  beforeEach(() => openCoach.mockClear())

  const arc = { soundIpa: null, topicLabel: 'Food', sessionWords: ['order', 'menu'] }

  it('opens chat with the seeded prefill', () => {
    render(<SpeakWithCoachCard arc={arc} />)
    fireEvent.click(screen.getByRole('button', { name: /conversa/i }))
    expect(openCoach).toHaveBeenCalledWith({
      tab: 'chat',
      prefill: expect.stringContaining('order, menu'),
    })
  })

  it('opens interview with the same prefill', () => {
    render(<SpeakWithCoachCard arc={arc} />)
    fireEvent.click(screen.getByRole('button', { name: /entrevista/i }))
    expect(openCoach).toHaveBeenCalledWith({
      tab: 'interview',
      prefill: expect.stringContaining('order, menu'),
    })
  })
})
