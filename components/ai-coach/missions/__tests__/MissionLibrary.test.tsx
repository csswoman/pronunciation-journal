// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
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

  it('calls onSelect when clicking start on a mission card', () => {
    const onSelect = vi.fn()
    const missions = listMissions()
    render(<MissionLibrary missions={missions} onSelect={onSelect} />)

    const buttons = screen.getAllByRole('button', { name: /empezar/i })
    expect(buttons.length).toBe(missions.length)
    fireEvent.click(buttons[0])
    expect(onSelect).toHaveBeenCalledWith(missions[0].id)
  })

  it('renders an empty state when the missions list is empty', () => {
    render(<MissionLibrary missions={[]} onSelect={vi.fn()} />)

    expect(screen.getByText(/no hay misiones/i)).toBeInTheDocument()
  })
})

describe('MissionLibrary category filter', () => {
  it('filters missions by category when a filter chip is clicked', () => {
    const missions = listMissions()
    const interview = missions.find((mission) => mission.category === 'interview')!
    const cafe = missions.find((mission) => mission.id === 'roleplay.cafe')!
    render(<MissionLibrary missions={missions} onSelect={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /servicios/i }))

    expect(screen.queryByText(interview.communicativeGoal)).not.toBeInTheDocument()
    expect(screen.getByText(cafe.communicativeGoal)).toBeInTheDocument()
  })

  it('shows an empty filter state when the category has no missions', () => {
    const missions = listMissions().filter((mission) => mission.category !== 'social')
    render(<MissionLibrary missions={missions} onSelect={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /^social$/i }))

    expect(screen.getByText(/no hay misiones en social/i)).toBeInTheDocument()
  })

  it('shows the empty state for mis diálogos when no generated scripts exist', () => {
    const missions = listMissions()
    render(<MissionLibrary missions={missions} onSelect={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /mis diálogos/i }))

    expect(
      screen.getByText(/aún no has generado diálogos personalizados/i),
    ).toBeInTheDocument()
  })
})

