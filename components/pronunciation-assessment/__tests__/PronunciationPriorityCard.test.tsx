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
  it('renders a CTA into the pronunciation path for a segmental target', () => {
    render(<PronunciationPriorityCard result={buildResult('segmental.phoneme./ə/')} rank={1} />)
    const link = screen.getByRole('link', { name: /practicar ahora/i })
    expect(link).toHaveAttribute(
      'href',
      `/courses/pronunciation?target=${encodeURIComponent('segmental.phoneme./ə/')}`
    )
  })

  it('also deep-links prosody targets into the pronunciation path', () => {
    render(<PronunciationPriorityCard result={buildResult('prosody.rhythm')} rank={1} />)
    const link = screen.getByRole('link', { name: /practicar ahora/i })
    expect(link).toHaveAttribute(
      'href',
      `/courses/pronunciation?target=${encodeURIComponent('prosody.rhythm')}`
    )
  })

  it('never renders a raw numeric score', () => {
    render(<PronunciationPriorityCard result={buildResult('segmental.phoneme./ə/')} rank={1} />)
    expect(screen.queryByText(/40/)).not.toBeInTheDocument()
  })
})
