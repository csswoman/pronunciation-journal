// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { PronunciationPriorityCard } from '../PronunciationPriorityCard'
import type { TargetResult } from '@/lib/pronunciation/assessment/types'

afterEach(() => cleanup())

function buildResult(targetId: string): TargetResult {
  return {
    targetId,
    status: 'priority',
    signalType: 'stt_intelligibility',
    confidence: 0.8,
    evaluatorKind: 'stt_intelligibility',
    evaluatorVersion: 'v1',
    measurement: { kind: 'scored', score: 40 },
  }
}

describe('PronunciationPriorityCard', () => {
  it('renders a direct CTA link for a target with a known practice route', () => {
    render(<PronunciationPriorityCard result={buildResult('segmental.phoneme./ə/')} rank={1} />)
    const link = screen.getByRole('link', { name: /practicar ahora/i })
    expect(link).toHaveAttribute('href', '/practice/sounds')
  })

  it('falls back to a message instead of a broken link for targets with no route', () => {
    render(<PronunciationPriorityCard result={buildResult('prosody.rhythm')} rank={1} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(/plan de cinco días/i)).toBeInTheDocument()
  })

  it('never renders a raw numeric score', () => {
    render(<PronunciationPriorityCard result={buildResult('segmental.phoneme./ə/')} rank={1} />)
    expect(screen.queryByText(/40/)).not.toBeInTheDocument()
  })
})
