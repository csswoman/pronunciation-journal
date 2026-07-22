// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PronunciationResults } from '../PronunciationResults'
import type { PronunciationDiagnosticResult } from '@/lib/pronunciation/assessment/schema'

afterEach(() => cleanup())

function buildResult(overrides: Partial<PronunciationDiagnosticResult> = {}): PronunciationDiagnosticResult {
  return {
    userId: 'user-1',
    completedAt: new Date().toISOString(),
    capabilitySnapshot: {
      micPermission: 'granted',
      sttAvailable: true,
      browserSupport: 'full',
      capturedAt: new Date().toISOString(),
    },
    selfReport: { overallConfidence: 'somewhat_confident' },
    targetResults: [
      {
        targetId: 'segmental.phoneme./ə/',
        status: 'priority',
        signalType: 'stt_intelligibility',
        confidence: 0.8,
        evaluatorKind: 'stt_intelligibility',
        evaluatorVersion: 'v1',
        measurement: { kind: 'scored', score: 40 },
      },
      {
        targetId: 'prosody.word-stress',
        status: 'observed',
        signalType: 'perception',
        confidence: 0.6,
        evaluatorKind: 'stt_intelligibility',
        evaluatorVersion: 'perception-forced-choice-v1',
        measurement: { kind: 'scored', score: 60 },
      },
    ],
    prescription: {
      generatedAt: new Date().toISOString(),
      sessions: Array.from({ length: 5 }, (_, i) => ({
        targetId: 'segmental.phoneme./ə/',
        reason: `Session ${i + 1} reason`,
        style: i === 4 ? ('transfer' as const) : ('drill' as const),
      })),
    },
    ...overrides,
  }
}

describe('PronunciationResults', () => {
  it('leads with the priority section, not an aggregate score', async () => {
    render(
      <PronunciationResults result={buildResult()} saving={false} saveError={false} onRetrySave={vi.fn()} />
    )

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/trabajar primero/i)
    expect(heading).not.toHaveTextContent(/\d+\s*\/\s*100/)
    expect(screen.queryByText(/score/i)).not.toBeInTheDocument()
    // The collapsed evidence-detail <details> may legitimately contain raw
    // scores — but the priority card itself (the "lead" content) must not.
    const priorityCard = screen.getByRole('heading', { level: 3, name: /schwa/i }).closest('li') as HTMLElement
    expect(priorityCard).not.toHaveTextContent(/\d+\s*\/\s*100/)
  })

  it('moves focus to the results heading on mount', async () => {
    render(
      <PronunciationResults result={buildResult()} saving={false} saveError={false} onRetrySave={vi.fn()} />
    )
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveFocus()
  })

  it('shows a direct CTA for a priority target with a known practice route', () => {
    render(
      <PronunciationResults result={buildResult()} saving={false} saveError={false} onRetrySave={vi.fn()} />
    )
    const cta = screen.getByRole('link', { name: /practicar ahora/i })
    expect(cta).toHaveAttribute('href', '/practice/sounds')
  })

  it('renders the five-day plan with exactly five sessions', () => {
    render(
      <PronunciationResults result={buildResult()} saving={false} saveError={false} onRetrySave={vi.fn()} />
    )
    expect(screen.getAllByText(/^Día \d/)).toHaveLength(5)
  })

  it('evidence detail is collapsed by default (progressive disclosure)', () => {
    render(
      <PronunciationResults result={buildResult()} saving={false} saveError={false} onRetrySave={vi.fn()} />
    )
    const details = screen.getByText(/ver todo lo que medimos/i).closest('details')
    expect(details).not.toHaveAttribute('open')
  })

  it('shows a retry button on save error and calls onRetrySave when clicked', async () => {
    const onRetrySave = vi.fn()
    render(
      <PronunciationResults result={buildResult()} saving={false} saveError={true} onRetrySave={onRetrySave} />
    )
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/no se pudo guardar/i)

    const retryButton = screen.getByRole('button', { name: /reintentar/i })
    await userEvent.click(retryButton)
    expect(onRetrySave).toHaveBeenCalledTimes(1)
  })

  it('is keyboard navigable via Tab to the CTA links', async () => {
    render(
      <PronunciationResults result={buildResult()} saving={false} saveError={false} onRetrySave={vi.fn()} />
    )
    await userEvent.tab()
    // Heading itself is tabIndex={-1} (programmatic focus only, not in tab order)
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveFocus()
  })
})
