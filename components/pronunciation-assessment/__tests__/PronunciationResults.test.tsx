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
        evaluatorKind: 'perception_forced_choice',
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
  it('uses honest copy when nothing was measured', () => {
    render(
      <PronunciationResults
        result={buildResult({
          targetResults: [
            {
              targetId: 'segmental.phoneme./ə/',
              status: 'needs_evidence',
              signalType: 'stt_intelligibility',
              confidence: 0,
              evaluatorKind: null,
              evaluatorVersion: null,
              measurement: { kind: 'not_measured', abstentionReason: 'skipped_by_user' },
            },
          ],
        })}
        saving={false}
        saveError={false}
        onRetrySave={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/reunir evidencia/i)
    expect(screen.getByText(/por dónde empezar/i)).toBeInTheDocument()
    expect(screen.queryByText(/buen trabajo/i)).not.toBeInTheDocument()
  })

  it('echoes a struggle self-report in the peak-end heading', () => {
    render(
      <PronunciationResults
        result={buildResult({
          targetResults: [
            {
              targetId: 'prosody.word-stress',
              status: 'needs_evidence',
              signalType: 'self_report',
              confidence: 0.4,
              evaluatorKind: null,
              evaluatorVersion: null,
              measurement: { kind: 'not_measured', abstentionReason: 'no_evaluator_available' },
            },
          ],
          prescription: {
            generatedAt: new Date().toISOString(),
            sessions: Array.from({ length: 5 }, (_, i) => ({
              targetId: 'prosody.word-stress',
              reason: `Session ${i + 1}`,
              style: i === 4 ? ('transfer' as const) : ('drill' as const),
            })),
          },
        })}
        saving={false}
        saveError={false}
        onRetrySave={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/lo que nos dijiste/i)
    expect(screen.getByText(/nos dijiste que te cuesta:/i)).toBeInTheDocument()
  })

  it('offers restart and deep-links the primary CTA to day-one practice', () => {
    const onRestart = vi.fn()
    render(
      <PronunciationResults
        result={buildResult({
          targetResults: [
            {
              targetId: 'segmental.phoneme./ə/',
              status: 'needs_evidence',
              signalType: 'stt_intelligibility',
              confidence: 0,
              evaluatorKind: null,
              evaluatorVersion: null,
              measurement: { kind: 'not_measured', abstentionReason: 'skipped_by_user' },
            },
          ],
        })}
        saving={false}
        saveError={false}
        onRetrySave={vi.fn()}
        onRestart={onRestart}
      />
    )

    expect(screen.getByRole('link', { name: /empezar a practicar/i })).toHaveAttribute(
      'href',
      '/practice/sounds'
    )
    expect(screen.getByRole('button', { name: /repetir el diagnóstico/i })).toBeInTheDocument()
  })

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
    const priorityCard = screen
      .getByRole('heading', { level: 3, name: /vocal relajada/i })
      .closest('li') as HTMLElement
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

  it('hides legacy prescription sessions for targets that had no evaluator', () => {
    render(
      <PronunciationResults
        result={buildResult({
          targetResults: [
            {
              targetId: 'segmental.phoneme./ə/',
              status: 'priority',
              signalType: 'stt_intelligibility',
              confidence: 0.8,
              evaluatorKind: 'stt_intelligibility',
              evaluatorVersion: 'stt-v1',
              measurement: { kind: 'scored', score: 40 },
            },
            {
              targetId: 'prosody.intonation.rising-question',
              status: 'needs_evidence',
              signalType: 'stt_intelligibility',
              confidence: 0,
              evaluatorKind: null,
              evaluatorVersion: null,
              measurement: { kind: 'not_measured', abstentionReason: 'no_evaluator_available' },
            },
          ],
          prescription: {
            generatedAt: new Date().toISOString(),
            sessions: [
              {
                targetId: 'segmental.phoneme./ə/',
                reason: 'Day 1 schwa',
                style: 'perception',
              },
              {
                targetId: 'prosody.intonation.rising-question',
                reason: 'Legacy unavailable day',
                style: 'drill',
              },
              {
                targetId: 'segmental.phoneme./ə/',
                reason: 'Day 3 schwa',
                style: 'drill',
              },
              {
                targetId: 'segmental.phoneme./ə/',
                reason: 'Day 4 schwa',
                style: 'drill',
              },
              {
                targetId: 'segmental.phoneme./ə/',
                reason: 'Day 5 schwa',
                style: 'transfer',
              },
            ],
          },
        })}
        saving={false}
        saveError={false}
        onRetrySave={vi.fn()}
      />
    )

    expect(screen.getAllByText(/^Día \d/)).toHaveLength(4)
    expect(screen.queryByText(/entonación|rising-question|Legacy unavailable/i)).not.toBeInTheDocument()
  })

  it('evidence detail is collapsed by default (progressive disclosure)', () => {
    render(
      <PronunciationResults result={buildResult()} saving={false} saveError={false} onRetrySave={vi.fn()} />
    )
    const details = screen.getByText(/ver todo lo que medimos/i).closest('details')
    expect(details).not.toHaveAttribute('open')
  })

  it('withdraws target assessment copy when the flag is off', () => {
    render(
      <PronunciationResults
        result={buildResult()}
        saving={false}
        saveError={false}
        onRetrySave={vi.fn()}
        copyEnabled={false}
      />
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/siguiente práctica/i)
    expect(screen.queryByRole('heading', { level: 3, name: /vocal relajada/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/puntaje|confianza|prioridad|fortaleza|observado/i)).not.toBeInTheDocument()
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
    // Results heading is tabIndex={-1} (programmatic focus only, not in tab order)
    expect(screen.getByRole('heading', { level: 2 })).not.toHaveFocus()
  })
})
