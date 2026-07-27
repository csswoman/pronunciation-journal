// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const { speakPhrase } = vi.hoisted(() => ({ speakPhrase: vi.fn() }))

vi.mock('../MissionRunner', () => ({
  default: ({ state, onListen, onSlow }: {
    state: { intentsObserved: Set<string> }
    onListen: () => void
    onSlow: () => void
  }) => (
    <>
      <output>{state.intentsObserved.size}</output>
      <button type="button" onClick={onListen}>Escuchar</button>
      <button type="button" onClick={onSlow}>Más lento</button>
    </>
  ),
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'learner-1' } }),
}))

vi.mock('@/lib/ai-coach/pronunciation', () => ({ speakPhrase }))

import { MissionWorkspace } from '../MissionWorkspace'

describe('MissionWorkspace', () => {
  it('routes observed model intents into its mission reducer state', () => {
    let observedIntent: ((intentId: string) => void) | null = null
    const setMissionIntentHandler = vi.fn((handler: ((intentId: string) => void) | null) => {
      observedIntent = handler
    })

    render(<MissionWorkspace missionId="roleplay.cafe" setMissionIntentHandler={setMissionIntentHandler} />)

    act(() => observedIntent?.('placed_order'))

    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('plays the correction phrase at normal and slow rates', () => {
    render(<MissionWorkspace missionId="roleplay.cafe" setMissionIntentHandler={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Escuchar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Más lento' }))

    expect(speakPhrase).toHaveBeenNthCalledWith(1, "I'd like a medium latte, please.")
    expect(speakPhrase).toHaveBeenNthCalledWith(2, "I'd like a medium latte, please.", 0.55)
  })
})
