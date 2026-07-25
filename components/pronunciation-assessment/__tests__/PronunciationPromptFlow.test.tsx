// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PronunciationPromptFlow } from '../PronunciationPromptFlow'
import type { DiagnosticPromptSelection } from '@/lib/pronunciation/assessment/prompt-selection'
import type { CapabilitySnapshot, TargetResult } from '@/lib/pronunciation/assessment/types'
import { contrastTargetId, phonemeTargetId, targetId } from '@/lib/pronunciation/targets/registry'

type OnComplete = (targetResults: TargetResult[]) => void

afterEach(() => {
  cleanup()
  delete (window as { SpeechRecognition?: unknown }).SpeechRecognition
})

const fullCapability: CapabilitySnapshot = {
  micPermission: 'granted',
  sttAvailable: true,
  browserSupport: 'full',
  capturedAt: new Date().toISOString(),
}

const deniedCapability: CapabilitySnapshot = {
  micPermission: 'denied',
  sttAvailable: false,
  browserSupport: 'partial',
  capturedAt: new Date().toISOString(),
}

const selections: DiagnosticPromptSelection[] = [
  { targetId: contrastTargetId('/θ/', '/ð/'), stage: 'perception' },
  { targetId: phonemeTargetId('/ə/'), stage: 'perception' },
]

function renderFlow(
  props: Partial<{
    selections: DiagnosticPromptSelection[]
    capabilitySnapshot: CapabilitySnapshot
    onComplete: ReturnType<typeof vi.fn<OnComplete>>
  }> = {}
) {
  const onComplete = props.onComplete ?? vi.fn<OnComplete>()
  render(
    <PronunciationPromptFlow
      userId="user-1"
      selections={props.selections ?? selections}
      capabilitySnapshot={props.capabilitySnapshot ?? fullCapability}
      onComplete={onComplete}
    />
  )
  return onComplete
}

describe('PronunciationPromptFlow', () => {
  it('announces progress via an aria-live region and advances it after an answer', async () => {
    renderFlow()

    const progressCopy = document.querySelector('[aria-live="polite"]') as HTMLElement
    expect(progressCopy).toHaveTextContent('Pregunta 1 de 2')

    await userEvent.click(screen.getByRole('button', { name: /me desenvuelvo bien/i }))

    await waitFor(() => {
      expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Pregunta 2 de 2')
    })
  })

  it('moves focus to the next prompt heading on transition', async () => {
    renderFlow()

    const firstHeading = screen.getByRole('heading', { level: 2 })
    expect(firstHeading).toHaveFocus()

    await userEvent.click(screen.getByRole('button', { name: /me desenvuelvo bien/i }))

    await waitFor(() => {
      const nextHeading = screen.getByRole('heading', { level: 2 })
      expect(nextHeading).toHaveFocus()
    })
  })

  it('is keyboard operable (tab reaches the answer buttons)', async () => {
    renderFlow()

    await userEvent.tab()
    expect(screen.getByRole('button', { name: /me desenvuelvo bien/i })).toHaveFocus()
  })

  it('calls onComplete with accumulated target results after the last prompt', async () => {
    const onComplete = renderFlow()

    await userEvent.click(screen.getByRole('button', { name: /me desenvuelvo bien/i }))
    await waitFor(() => {
      expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Pregunta 2 de 2')
    })
    await userEvent.click(screen.getByRole('button', { name: /me desenvuelvo bien/i }))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
    const results = onComplete.mock.calls[0][0]
    expect(results).toHaveLength(2)
  })

  it('supports skipping a prompt without answering it', async () => {
    const onComplete = renderFlow({ selections: [selections[0]] })

    await userEvent.click(screen.getByRole('button', { name: /saltar/i }))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
    expect(onComplete.mock.calls[0][0][0].measurement.kind).toBe('not_measured')
  })

  it('lets the learner go back and replace the previous answer', async () => {
    const onComplete = renderFlow()

    expect(screen.queryByRole('button', { name: /anterior/i })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /me desenvuelvo bien/i }))
    await waitFor(() => {
      expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Pregunta 2 de 2')
    })

    await userEvent.click(screen.getByRole('button', { name: /anterior/i }))
    await waitFor(() => {
      expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Pregunta 1 de 2')
    })

    await userEvent.click(screen.getByRole('button', { name: /me cuesta/i }))
    await waitFor(() => {
      expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Pregunta 2 de 2')
    })
    await userEvent.click(screen.getByRole('button', { name: /saltar/i }))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
    expect(onComplete.mock.calls[0][0][0].measurement).toEqual({ kind: 'scored', score: 0 })
  })

  it('hides production prompts when mic/STT cannot evaluate and auto-skips them', async () => {
    const mixed: DiagnosticPromptSelection[] = [
      { targetId: contrastTargetId('/θ/', '/ð/'), stage: 'perception' },
      { targetId: targetId('prosody.rhythm'), stage: 'controlled_production' },
    ]
    const onComplete = renderFlow({
      selections: mixed,
      capabilitySnapshot: deniedCapability,
    })

    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Pregunta 1 de 1')
    expect(screen.queryByRole('button', { name: /grabar/i })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /me desenvuelvo bien/i }))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
    const results = onComplete.mock.calls[0][0]
    expect(results).toHaveLength(2)
    expect(results[1].measurement.kind).toBe('not_measured')
  })
})
