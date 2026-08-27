// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
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
})

describe('MissionLibrary — distincion por modo', () => {
  it('marca las misiones con guion como practica de habla', () => {
    const missions = listMissions()
    const scripted = missions.find((mission) => mission.mode === 'scripted')!
    render(<MissionLibrary missions={missions} onSelect={vi.fn()} />)

    const card = screen.getByText(scripted.communicativeGoal).closest('article')!
    expect(within(card).getByText(/habla/i)).toBeInTheDocument()
  })

  it('no marca las conversacionales con esa etiqueta', () => {
    const missions = listMissions()
    const conversational = missions.find((mission) => mission.mode === 'conversational')!
    render(<MissionLibrary missions={missions} onSelect={vi.fn()} />)

    const card = screen.getByText(conversational.communicativeGoal).closest('article')!
    expect(within(card).queryByText(/habla/i)).not.toBeInTheDocument()
  })

  it('lista primero las misiones con guion: son las de audio', () => {
    const missions = listMissions()
    render(<MissionLibrary missions={missions} onSelect={vi.fn()} />)

    const goals = screen.getAllByRole('article')
      .map((card) => card.querySelector('h3')?.textContent)
    const scriptedGoals = missions
      .filter((mission) => mission.mode === 'scripted')
      .map((mission) => mission.communicativeGoal)

    expect(goals.slice(0, scriptedGoals.length)).toEqual(scriptedGoals)
  })
})
