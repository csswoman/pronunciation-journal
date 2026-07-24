// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CapabilityPreflight } from '../CapabilityPreflight'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete (window as { SpeechRecognition?: unknown }).SpeechRecognition
  delete (window as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  Object.defineProperty(navigator, 'permissions', {
    value: originalPermissions,
    configurable: true,
  })
})

const originalPermissions = navigator.permissions

// jsdom's `window` and `document` are linked — replacing the whole `window`
// global (as `hooks/__tests__/useVoiceRecorder.test.ts` does for a plain
// node environment) breaks `render()` here. Instead patch only the specific
// properties this component reads, and restore them in `afterEach`.
function stubGlobals(opts: {
  hasSpeechRecognition?: boolean
  onLine?: boolean
  permissionState?: 'granted' | 'denied' | 'prompt'
  permissionsUnavailable?: boolean
}) {
  const {
    hasSpeechRecognition = true,
    onLine = true,
    permissionState = 'granted',
    permissionsUnavailable = false,
  } = opts

  if (hasSpeechRecognition) {
    ;(window as { SpeechRecognition?: unknown }).SpeechRecognition = function () {}
  }
  Object.defineProperty(navigator, 'onLine', { value: onLine, configurable: true })
  Object.defineProperty(navigator, 'permissions', {
    value: permissionsUnavailable
      ? undefined
      : { query: vi.fn().mockResolvedValue({ state: permissionState }) },
    configurable: true,
  })
}

describe('CapabilityPreflight', () => {
  it('shows the privacy explanation and a continue action when fully supported', async () => {
    stubGlobals({ hasSpeechRecognition: true, onLine: true, permissionState: 'granted' })
    const onContinue = vi.fn()

    render(<CapabilityPreflight onContinue={onContinue} />)

    // Privacy explanation is present up front, before recording.
    expect(
      screen.getByText(/no.*guardamos.*audio|audio.*no.*se guarda/i)
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /empezar las preguntas/i })).toBeEnabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /empezar las preguntas/i }))
    expect(onContinue).toHaveBeenCalledTimes(1)
    const snapshot = onContinue.mock.calls[0][0]
    expect(snapshot.browserSupport).toBe('full')
    expect(snapshot.sttAvailable).toBe(true)
  })

  it('permission denied: still navigable via perception/self-report continue path', async () => {
    stubGlobals({ hasSpeechRecognition: true, onLine: true, permissionState: 'denied' })
    const onContinue = vi.fn()

    render(<CapabilityPreflight onContinue={onContinue} />)

    await waitFor(() => {
      expect(screen.getByText(/no pudimos evaluar tu pronunciaci[oó]n/i)).toBeInTheDocument()
    })

    const continueButton = screen.getByRole('button', { name: /empezar las preguntas/i })
    expect(continueButton).toBeEnabled()
    await userEvent.click(continueButton)
    expect(onContinue).toHaveBeenCalledTimes(1)
    expect(onContinue.mock.calls[0][0].micPermission).toBe('denied')
  })

  it('unsupported browser: still navigable via perception/self-report continue path', async () => {
    stubGlobals({ hasSpeechRecognition: false, onLine: true })
    const onContinue = vi.fn()

    render(<CapabilityPreflight onContinue={onContinue} />)

    await waitFor(() => {
      expect(screen.getByText(/no pudimos evaluar tu pronunciaci[oó]n/i)).toBeInTheDocument()
    })

    const continueButton = screen.getByRole('button', { name: /empezar las preguntas/i })
    expect(continueButton).toBeEnabled()
    await userEvent.click(continueButton)
    expect(onContinue.mock.calls[0][0].browserSupport).toBe('unsupported')
  })

  it('offline: still navigable, sttAvailable forced false', async () => {
    stubGlobals({ hasSpeechRecognition: true, onLine: false, permissionState: 'granted' })
    const onContinue = vi.fn()

    render(<CapabilityPreflight onContinue={onContinue} />)

    await waitFor(() => {
      expect(screen.getByText(/no pudimos evaluar tu pronunciaci[oó]n/i)).toBeInTheDocument()
    })

    const continueButton = screen.getByRole('button', { name: /empezar las preguntas/i })
    expect(continueButton).toBeEnabled()
    await userEvent.click(continueButton)
    expect(onContinue.mock.calls[0][0].sttAvailable).toBe(false)
  })

  it('evaluator unavailable (permissions API missing, treated as unknown, but sttAvailable still computed): remains navigable', async () => {
    stubGlobals({ hasSpeechRecognition: true, onLine: true, permissionsUnavailable: true })
    const onContinue = vi.fn()

    render(<CapabilityPreflight onContinue={onContinue} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /empezar las preguntas/i })).toBeEnabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /empezar las preguntas/i }))
    expect(onContinue.mock.calls[0][0].micPermission).toBe('unknown')
  })
})
