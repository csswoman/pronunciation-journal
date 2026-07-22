// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { PronunciationFiveDayPlan } from '../PronunciationFiveDayPlan'
import type { PrescriptionSession } from '@/lib/pronunciation/assessment/schema'

afterEach(() => cleanup())

const sessions: PrescriptionSession[] = Array.from({ length: 5 }, (_, i) => ({
  targetId: 'segmental.phoneme./ə/',
  reason: `Reason ${i + 1}`,
  style: i === 4 ? 'transfer' : 'drill',
}))

describe('PronunciationFiveDayPlan', () => {
  it('renders exactly five day entries in order', () => {
    render(<PronunciationFiveDayPlan sessions={sessions} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(5)
    expect(items[0]).toHaveTextContent('Día 1')
    expect(items[4]).toHaveTextContent('Día 5')
  })

  it('shows the reason text for each session', () => {
    render(<PronunciationFiveDayPlan sessions={sessions} />)
    expect(screen.getByText('Reason 1')).toBeInTheDocument()
    expect(screen.getByText('Reason 5')).toBeInTheDocument()
  })
})
