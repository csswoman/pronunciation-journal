// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SessionRecapCard from '@/components/daily/SessionRecapCard'
import type { SessionArc } from '@/lib/practice/types'

vi.mock('dexie-react-hooks', () => ({ useLiveQuery: () => 748 }))
vi.mock('@/lib/db', () => ({ db: { srsData: {} } }))
vi.mock('@/lib/core-1000/types', () => ({ CORE1000_PREFIX: 'c1k:' }))

const arc: SessionArc = {
  topicLabel: 'Presente simple',
  soundIpa: 'ɪ',
  sessionWords: ['ship', 'live', 'fish'],
}

describe('SessionRecapCard', () => {
  it('shows topic, words, and due-tomorrow when available', () => {
    render(<SessionRecapCard arc={arc} stepCount={5} dueTomorrow={3} streak={4} />)
    expect(screen.getByText(/Presente simple/)).toBeInTheDocument()
    expect(screen.getByText(/ship/)).toBeInTheDocument()
    expect(screen.getByText(/vuelven mañana/i)).toBeInTheDocument()
    expect(screen.getByText(/4/)).toBeInTheDocument()
  })

  it('omits the due-tomorrow line when dueTomorrow is null (offline)', () => {
    render(<SessionRecapCard arc={arc} stepCount={5} dueTomorrow={null} streak={4} />)
    expect(screen.queryByText(/vuelven mañana/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Presente simple/)).toBeInTheDocument()
  })

  it('omits due-tomorrow when dueTomorrow is 0', () => {
    render(<SessionRecapCard arc={arc} stepCount={5} dueTomorrow={0} streak={null} />)
    expect(screen.queryByText(/vuelven mañana/i)).not.toBeInTheDocument()
  })

  it('renders gracefully with no arc', () => {
    render(<SessionRecapCard arc={undefined} stepCount={5} dueTomorrow={null} streak={null} />)
    expect(screen.getByText(/Daily complete/i)).toBeInTheDocument()
  })
})
