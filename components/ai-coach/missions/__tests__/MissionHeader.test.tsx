// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MissionHeader } from '../MissionHeader'
import { getMission } from '@/lib/ai-practice/missions/registry'
import type { ConversationalMission } from '@/lib/ai-practice/missions/types'

const mission = getMission('roleplay.cafe') as ConversationalMission

describe('MissionHeader', () => {
  it('renders teacher and student roles clearly', () => {
    render(<MissionHeader mission={mission} turnCount={1} maxTurns={6} />)

    expect(screen.getByText('barista')).toBeInTheDocument()
    expect(screen.getByText('customer')).toBeInTheDocument()
  })

  it('displays turn count progress and communicative goal', () => {
    render(<MissionHeader mission={mission} turnCount={2} maxTurns={6} />)

    expect(screen.getByText('2/6')).toBeInTheDocument()
    expect(screen.getByText(mission.communicativeGoal)).toBeInTheDocument()
  })

  it('toggles mission context details when clicking info button', () => {
    render(<MissionHeader mission={mission} turnCount={0} maxTurns={6} />)

    const toggleButton = screen.getByRole('button', { name: /detalles/i })
    expect(screen.queryByText(mission.context)).not.toBeInTheDocument()

    fireEvent.click(toggleButton)
    expect(screen.getByText(mission.context)).toBeInTheDocument()

    fireEvent.click(toggleButton)
    expect(screen.queryByText(mission.context)).not.toBeInTheDocument()
  })

  it('renders and invokes back button when onExit is provided', () => {
    const onExit = vi.fn()
    render(<MissionHeader mission={mission} turnCount={1} maxTurns={6} onExit={onExit} />)

    const backButton = screen.getByRole('button', { name: /volver/i })
    expect(backButton).toBeInTheDocument()

    fireEvent.click(backButton)
    expect(onExit).toHaveBeenCalledOnce()
  })
})
