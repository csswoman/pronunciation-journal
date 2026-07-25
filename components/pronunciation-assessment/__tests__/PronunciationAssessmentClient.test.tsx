// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../CapabilityPreflight', () => ({
  CapabilityPreflight: ({
    onContinue,
  }: {
    onContinue: (snapshot: {
      micPermission: string
      sttAvailable: boolean
      browserSupport: string
      capturedAt: string
    }) => void
  }) => (
    <button
      type="button"
      onClick={() =>
        onContinue({
          micPermission: 'granted',
          sttAvailable: true,
          browserSupport: 'full',
          capturedAt: new Date().toISOString(),
        })
      }
    >
      Empezar las preguntas
    </button>
  ),
}))

vi.mock('../PronunciationPromptFlow', () => ({
  PronunciationPromptFlow: ({
    onComplete,
  }: {
    onComplete: (results: unknown[]) => void
  }) => (
    <button
      type="button"
      onClick={() =>
        onComplete([
          {
            targetId: 'prosody.word-stress',
            status: 'observed',
            signalType: 'perception',
            confidence: 0.6,
            evaluatorKind: 'perception_forced_choice',
            evaluatorVersion: 'perception-forced-choice-v1',
            // Invalid under schema: prosody-only + numeric score
            measurement: { kind: 'scored', score: 100 },
          },
        ])
      }
    >
      Terminar con resultado inválido
    </button>
  ),
}))

vi.mock('@/lib/pronunciation/assessment/persistence', () => ({
  persistPronunciationAssessmentLocal: vi.fn(),
}))

vi.mock('@/lib/pronunciation/assessment/guest-transfer', () => ({
  saveGuestPronunciationDiagnostic: vi.fn(),
}))

import { PronunciationAssessmentClient } from '../PronunciationAssessmentClient'

afterEach(() => cleanup())

describe('PronunciationAssessmentClient', () => {
  it('surfaces a finish error instead of silently trapping the learner', async () => {
    render(<PronunciationAssessmentClient userId="user-1" />)

    await userEvent.click(screen.getByRole('button', { name: /empezar las preguntas/i }))
    await userEvent.click(screen.getByRole('button', { name: /terminar con resultado inválido/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/no pudimos cerrar el diagnóstico/i)
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeEnabled()
    expect(screen.queryByRole('button', { name: /terminar con resultado inválido/i })).not.toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
