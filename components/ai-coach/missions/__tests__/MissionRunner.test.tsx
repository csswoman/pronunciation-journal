// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MissionRunner from '../MissionRunner'
import { createMissionState } from '@/lib/ai-practice/missions/state-machine'
import { getMission } from '@/lib/ai-practice/missions/registry'

const mission = getMission('roleplay.cafe')!

describe('MissionRunner', () => {
  it('shows the briefing context and opening during briefing', () => {
    const state = createMissionState(mission.id)
    render(<MissionRunner mission={mission} state={state} onRetry={vi.fn()} onListen={vi.fn()} onSlow={vi.fn()} onTransfer={vi.fn()} />)

    expect(screen.getByText(mission.opening)).toBeInTheDocument()
  })

  it('shows the RemediationSequence controls during correction', () => {
    const state = {
      ...createMissionState(mission.id),
      phase: 'correction' as const,
      pendingCorrection: { targetId: mission.targets[0].targetId },
    }
    render(<MissionRunner mission={mission} state={state} onRetry={vi.fn()} onListen={vi.fn()} onSlow={vi.fn()} onTransfer={vi.fn()} />)

    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('shows the transfer prompt during transfer', () => {
    const state = { ...createMissionState(mission.id), phase: 'transfer' as const }
    render(<MissionRunner mission={mission} state={state} onRetry={vi.fn()} onListen={vi.fn()} onSlow={vi.fn()} onTransfer={vi.fn()} />)

    expect(screen.getByText(mission.transferVariant.opening)).toBeInTheDocument()
  })
})
