// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PronunciationPromptFlow } from '../PronunciationPromptFlow'
import type { DiagnosticPromptSelection } from '@/lib/pronunciation/assessment/prompt-selection'
import { targetId } from '@/lib/pronunciation/targets/registry'

afterEach(() => {
  cleanup()
  delete (window as { SpeechRecognition?: unknown }).SpeechRecognition
})

const selections: DiagnosticPromptSelection[] = [
  { targetId: targetId('segmental.contrast.θ|ð'), stage: 'perception' },
  { targetId: targetId('segmental.phoneme./ə/'), stage: 'perception' },
]

describe('PronunciationPromptFlow', () => {
  it('announces progress via an aria-live region and advances it after an answer', async () => {
    const onComplete = vi.fn()
    render(<PronunciationPromptFlow userId="user-1" selections={selections} onComplete={onComplete} />)

    const progressCopy = screen.getByText('de 2').closest('[aria-live="polite"]') as HTMLElement
    expect(progressCopy).toHaveTextContent('0')

    await userEvent.click(screen.getByRole('button', { name: /sí, lo distingo/i }))

    await waitFor(() => {
      expect(screen.getByText('de 2').closest('[aria-live="polite"]')).toHaveTextContent('1')
    })
  })

  it('moves focus to the next prompt heading on transition', async () => {
    const onComplete = vi.fn()
    render(<PronunciationPromptFlow userId="user-1" selections={selections} onComplete={onComplete} />)

    const firstHeading = screen.getByRole('heading', { level: 2 })
    expect(firstHeading).toHaveFocus()

    await userEvent.click(screen.getByRole('button', { name: /sí, lo distingo/i }))

    await waitFor(() => {
      const nextHeading = screen.getByRole('heading', { level: 2 })
      expect(nextHeading).toHaveFocus()
    })
  })

  it('is keyboard operable (tab reaches the answer buttons)', async () => {
    const onComplete = vi.fn()
    render(<PronunciationPromptFlow userId="user-1" selections={selections} onComplete={onComplete} />)

    await userEvent.tab()
    expect(screen.getByRole('button', { name: /sí, lo distingo/i })).toHaveFocus()
  })

  it('calls onComplete with accumulated target results after the last prompt', async () => {
    const onComplete = vi.fn()
    render(<PronunciationPromptFlow userId="user-1" selections={selections} onComplete={onComplete} />)

    await userEvent.click(screen.getByRole('button', { name: /sí, lo distingo/i }))
    await waitFor(() => screen.getByText('de 2'))
    await userEvent.click(screen.getByRole('button', { name: /sí, lo distingo/i }))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
    const results = onComplete.mock.calls[0][0]
    expect(results).toHaveLength(2)
  })

  it('supports skipping a prompt without answering it', async () => {
    const onComplete = vi.fn()
    render(<PronunciationPromptFlow userId="user-1" selections={[selections[0]]} onComplete={onComplete} />)

    await userEvent.click(screen.getByRole('button', { name: /saltar/i }))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
    expect(onComplete.mock.calls[0][0][0].measurement.kind).toBe('not_measured')
  })
})
