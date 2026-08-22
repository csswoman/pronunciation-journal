// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const speechMocks = vi.hoisted(() => ({
  useSpeechRecognition: vi.fn(),
}))

vi.mock('@/hooks/useSpeechRecognition', () => speechMocks)

import { PronunciationProductionPrompt } from '../PronunciationProductionPrompt'
import { phonemeTargetId } from '@/lib/pronunciation/targets/registry'

afterEach(() => cleanup())

const selection = {
  targetId: phonemeTargetId('/ə/'),
  stage: 'controlled_production' as const,
}

function mockSpeech(
  overrides: Partial<ReturnType<(typeof speechMocks)['useSpeechRecognition']>> = {}
) {
  speechMocks.useSpeechRecognition.mockReturnValue({
    status: 'idle',
    result: null,
    errorCode: null,
    isSupported: true,
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  })
}

describe('PronunciationProductionPrompt', () => {
  beforeEach(() => {
    speechMocks.useSpeechRecognition.mockReset()
    mockSpeech()
  })

  it('announces listening state in a live region while recording', () => {
    mockSpeech({ status: 'listening' })
    render(
      <PronunciationProductionPrompt
        userId="user-1"
        selection={selection}
        onAttempt={vi.fn()}
      />
    )

    expect(screen.getByRole('status')).toHaveTextContent(/escuchando/i)
    const stopButton = screen.getByRole('button', { name: /detener grabación/i })
    expect(stopButton).toHaveAttribute('aria-pressed', 'true')
    expect(stopButton).toHaveTextContent(/^detener$/i)
    expect(stopButton.className).not.toMatch(/bg-error|bg-\[var\(--error\)\]/)
  })

  it('shows the heard transcript and waits for confirm before advancing', async () => {
    const onAttempt = vi.fn()
    mockSpeech({
      status: 'done',
      result: { transcript: 'about the idea', confidence: 0.82 },
    })

    render(
      <PronunciationProductionPrompt
        userId="user-1"
        selection={selection}
        onAttempt={onAttempt}
      />
    )

    expect(screen.getByText(/te escuché/i)).toBeInTheDocument()
    expect(screen.getByText(/about the idea/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /grabar de nuevo/i })).toBeInTheDocument()
    expect(onAttempt).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /continuar/i }))

    await waitFor(() => {
      expect(onAttempt).toHaveBeenCalledTimes(1)
    })
    expect(onAttempt.mock.calls[0][0].transcript).toBe('about the idea')
    expect(onAttempt.mock.calls[0][0].outcome).toBe('scored')
  })
})
