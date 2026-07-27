// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../MissionRunner', () => ({
  default: ({ state }: { state: { intentsObserved: Set<string> } }) => (
    <output>{state.intentsObserved.size}</output>
  ),
}))

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
})
