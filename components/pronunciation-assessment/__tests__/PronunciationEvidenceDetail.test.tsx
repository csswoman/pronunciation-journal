// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PronunciationEvidenceDetail } from '../PronunciationEvidenceDetail'
import type { TargetResult } from '@/lib/pronunciation/assessment/types'

afterEach(() => cleanup())

const targetResults: TargetResult[] = [
  {
    targetId: 'segmental.phoneme./ə/',
    status: 'observed',
    signalType: 'stt_intelligibility',
    confidence: 0.8,
    evaluatorKind: 'stt_intelligibility',
    evaluatorVersion: 'v1',
    measurement: { kind: 'scored', score: 55 },
  },
  {
    targetId: 'prosody.rhythm',
    status: 'needs_evidence',
    signalType: 'perception',
    confidence: 0,
    evaluatorKind: null,
    evaluatorVersion: null,
    measurement: { kind: 'not_measured', abstentionReason: 'skipped_by_user' },
  },
]

describe('PronunciationEvidenceDetail', () => {
  it('is collapsed by default and expandable via the disclosure widget', async () => {
    render(<PronunciationEvidenceDetail targetResults={targetResults} />)
    const details = screen.getByText(/ver todo lo que medimos/i).closest('details') as HTMLDetailsElement
    expect(details.open).toBe(false)

    await userEvent.click(screen.getByText(/ver todo lo que medimos/i))
    expect(details.open).toBe(true)
  })

  it('lists status and learner-facing measurement detail for every target result', () => {
    render(<PronunciationEvidenceDetail targetResults={targetResults} />)
    expect(screen.getByText('Se entendió')).toBeInTheDocument()
    expect(screen.getByText(/no confirma la precisión/i)).toBeInTheDocument()
    expect(screen.getByText(/la saltaste/i)).toBeInTheDocument()
  })

  it('names self-report struggle instead of the structural evaluator abstention', () => {
    render(
      <PronunciationEvidenceDetail
        targetResults={[
          {
            targetId: 'prosody.word-stress',
            status: 'needs_evidence',
            signalType: 'self_report',
            confidence: 0.4,
            evaluatorKind: null,
            evaluatorVersion: null,
            measurement: { kind: 'not_measured', abstentionReason: 'no_evaluator_available' },
          },
        ]}
      />
    )
    expect(screen.getByText(/nos dijiste que te cuesta/i)).toBeInTheDocument()
    expect(screen.queryByText(/no había evaluador/i)).not.toBeInTheDocument()
  })

  it('summarizes word-stress against the number of items presented this run', () => {
    render(
      <PronunciationEvidenceDetail
        targetResults={[
          {
            targetId: 'prosody.word-stress',
            status: 'strength',
            signalType: 'perception',
            confidence: 0.6,
            evaluatorKind: 'perception_forced_choice',
            evaluatorVersion: 'word-stress-listening-v1',
            measurement: { kind: 'scored', score: 60 },
            perceptionItemCount: 5,
          },
        ]}
      />
    )
    expect(screen.getByText(/3 de 5 palabras/i)).toBeInTheDocument()
  })

  it('hides dimensions that the diagnostic cannot evaluate', () => {
    render(
      <PronunciationEvidenceDetail
        targetResults={[{
          targetId: 'prosody.word-stress',
          status: 'needs_evidence',
          signalType: 'perception',
          confidence: 0,
          evaluatorKind: null,
          evaluatorVersion: null,
          measurement: { kind: 'not_measured', abstentionReason: 'no_evaluator_available' },
        }]}
      />
    )

    expect(screen.queryByText(/sílaba tónica/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/aún no medido/i)).not.toBeInTheDocument()
  })
})
