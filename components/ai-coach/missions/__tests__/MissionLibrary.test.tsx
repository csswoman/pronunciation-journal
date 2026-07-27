// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MissionLibrary from '../MissionLibrary'
import { listMissions } from '@/lib/ai-practice/missions/registry'

describe('MissionLibrary', () => {
  it('renders one MissionCard per mission when no category filter is active', () => {
    render(<MissionLibrary missions={listMissions()} onSelect={vi.fn()} />)

    for (const mission of listMissions()) {
      expect(screen.getByText(mission.communicativeGoal)).toBeInTheDocument()
    }
  })

  it('renders an empty state when the missions list is empty', () => {
    render(<MissionLibrary missions={[]} onSelect={vi.fn()} />)

    expect(screen.getByText(/no hay misiones/i)).toBeInTheDocument()
  })
})
