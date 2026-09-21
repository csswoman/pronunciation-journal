// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SprintProgress } from '../SprintProgress'
import type { FocusSprint } from '@/lib/focus/types'

const { state } = vi.hoisted(() => ({ state: { live: null as FocusSprint | null } }))
vi.mock('dexie-react-hooks', () => ({ useLiveQuery: () => state.live }))
vi.mock('@/components/illustrations/KoboyoSlot', () => ({ KoboyoSlot: () => null }))

describe('SprintProgress', () => {
  it('muestra Día 1 en curso al empezar y avanza al responder', () => {
    const now = Date.now()
    const sprint: FocusSprint = {
      id: 'sprint-1', userId: 'user-1', gaps: [], status: 'active',
      startsAt: new Date(now - 60_000).toISOString(),
      endsAt: new Date(now + 7 * 86_400_000 - 60_000).toISOString(),
      createdAt: new Date(now - 60_000).toISOString(),
    }
    state.live = { ...sprint, practice: { days: [{ day: 1, startedContentIds: ['story'], answeredExerciseKeys: [], completedContentIds: [], lastActivityAt: new Date(now).toISOString() }] } }
    const view = render(<SprintProgress sprint={sprint} />)
    expect(screen.getByText(/Día 1 en curso · empezaste un formato/)).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')

    state.live = { ...sprint, practice: { days: [{ day: 1, startedContentIds: ['story'], answeredExerciseKeys: ['story:one'], completedContentIds: [], lastActivityAt: new Date(now).toISOString() }] } }
    view.rerender(<SprintProgress sprint={sprint} />)
    expect(screen.getByText('1 de 7 días con práctica registrada')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '14')
  })
})
