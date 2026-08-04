// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HomeSpeakPrompt from '@/components/home/HomeSpeakPrompt'

const openCoach = vi.fn()
vi.mock('@/lib/stores/aiCoachStore', () => ({
  useAICoachStore: (selector: (s: { openCoach: typeof openCoach }) => unknown) =>
    selector({ openCoach }),
}))

describe('HomeSpeakPrompt', () => {
  beforeEach(() => openCoach.mockClear())

  const arc = { soundIpa: null, topicLabel: 'Food', sessionWords: ['order', 'menu'] }

  it('opens chat as the primary action with seeded prefill', () => {
    render(<HomeSpeakPrompt arc={arc} />)
    fireEvent.click(screen.getByRole('button', { name: /^conversa$/i }))
    expect(openCoach).toHaveBeenCalledWith({
      tab: 'chat',
      prefill: expect.stringContaining('order, menu'),
    })
  })

  it('opens misión oral with a title hint and the same prefill', () => {
    render(<HomeSpeakPrompt arc={arc} />)
    const mission = screen.getByRole('button', { name: /misión oral/i })
    expect(mission).toHaveAttribute('title', expect.stringMatching(/micrófono/i))
    fireEvent.click(mission)
    expect(openCoach).toHaveBeenCalledWith({
      tab: 'missions',
      prefill: expect.stringContaining('order, menu'),
    })
  })
})

